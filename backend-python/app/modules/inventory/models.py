import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class LocationType(str, enum.Enum):
    BRANCH = "BRANCH"
    WAREHOUSE = "WAREHOUSE"


class MovementType(str, enum.Enum):
    INITIAL = "INITIAL"
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"


class InventoryLocation(Base):
    __tablename__ = "inventory_locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )
    type: Mapped[LocationType] = mapped_column(
        SQLEnum(LocationType, native_enum=False, length=20),
        nullable=False,
    )
    address: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    inventory_items: Mapped[List["InventoryItem"]] = relationship(
        "InventoryItem",
        back_populates="location",
        cascade="all, delete-orphan",
    )
    incoming_movements: Mapped[List["InventoryMovement"]] = relationship(
        "InventoryMovement",
        foreign_keys="InventoryMovement.to_location_id",
        back_populates="to_location",
    )
    outgoing_movements: Mapped[List["InventoryMovement"]] = relationship(
        "InventoryMovement",
        foreign_keys="InventoryMovement.from_location_id",
        back_populates="from_location",
    )


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    __table_args__ = (
        UniqueConstraint("variant_id", "location_id", name="uq_inventory_item_variant_location"),
        CheckConstraint("quantity >= 0", name="check_inventory_item_quantity_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="check_inventory_item_reserved_non_negative"),
        CheckConstraint("reserved_quantity <= quantity", name="check_inventory_item_reserved_le_quantity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inventory_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    location: Mapped["InventoryLocation"] = relationship(
        "InventoryLocation",
        back_populates="inventory_items",
    )
    variant: Mapped["app.modules.catalog.models.ProductVariant"] = relationship(
        "app.modules.catalog.models.ProductVariant",
    )

    @property
    def available_quantity(self) -> int:
        return self.quantity - self.reserved_quantity


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_inventory_movement_quantity_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    from_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inventory_locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    to_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inventory_locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    movement_type: Mapped[MovementType] = mapped_column(
        SQLEnum(MovementType, native_enum=False, length=20),
        nullable=False,
        index=True,
    )
    reference: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    variant: Mapped["app.modules.catalog.models.ProductVariant"] = relationship(
        "app.modules.catalog.models.ProductVariant",
    )
    from_location: Mapped[Optional["InventoryLocation"]] = relationship(
        "InventoryLocation",
        foreign_keys=[from_location_id],
        back_populates="outgoing_movements",
    )
    to_location: Mapped[Optional["InventoryLocation"]] = relationship(
        "InventoryLocation",
        foreign_keys=[to_location_id],
        back_populates="incoming_movements",
    )
    user: Mapped[Optional["app.modules.auth.models.User"]] = relationship(
        "app.modules.auth.models.User",
    )
