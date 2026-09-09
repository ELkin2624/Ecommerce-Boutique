import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.modules.catalog.models import ProductVariant
from app.modules.inventory.models import (
    InventoryItem,
    InventoryLocation,
    InventoryMovement,
    MovementType,
)


class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==========================================
    # Location Operations
    # ==========================================
    def get_location_by_id(self, location_id: uuid.UUID) -> Optional[InventoryLocation]:
        stmt = select(InventoryLocation).where(InventoryLocation.id == location_id)
        return self.db.scalars(stmt).first()

    def find_location_by_name(self, name: str) -> Optional[InventoryLocation]:
        stmt = select(InventoryLocation).where(
            func.lower(InventoryLocation.name) == name.lower().strip()
        )
        return self.db.scalars(stmt).first()

    def list_locations(self, only_active: bool = False) -> List[InventoryLocation]:
        stmt = select(InventoryLocation)
        if only_active:
            stmt = stmt.where(InventoryLocation.is_active == True)
        stmt = stmt.order_by(InventoryLocation.name)
        return list(self.db.scalars(stmt).all())

    def create_location(self, location: InventoryLocation) -> InventoryLocation:
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def update_location(self, location: InventoryLocation) -> InventoryLocation:
        self.db.commit()
        self.db.refresh(location)
        return location

    # ==========================================
    # InventoryItem Operations
    # ==========================================
    def get_inventory_item(
        self, variant_id: uuid.UUID, location_id: uuid.UUID, for_update: bool = False
    ) -> Optional[InventoryItem]:
        """Fetch an inventory item with optional pessimistic locking (SELECT ... FOR UPDATE)."""
        stmt = (
            select(InventoryItem)
            .where(
                InventoryItem.variant_id == variant_id,
                InventoryItem.location_id == location_id,
            )
        )
        if for_update:
            stmt = stmt.with_for_update()
        else:
            stmt = stmt.options(joinedload(InventoryItem.location))
        return self.db.scalars(stmt).first()

    def get_inventory_item_by_id(self, item_id: uuid.UUID) -> Optional[InventoryItem]:
        stmt = select(InventoryItem).where(InventoryItem.id == item_id)
        return self.db.scalars(stmt).first()

    def create_inventory_item(self, item: InventoryItem) -> InventoryItem:
        self.db.add(item)
        self.db.flush()
        return item

    def list_items_by_variant(self, variant_id: uuid.UUID) -> List[InventoryItem]:
        stmt = (
            select(InventoryItem)
            .options(joinedload(InventoryItem.location))
            .where(InventoryItem.variant_id == variant_id)
            .order_by(InventoryItem.created_at)
        )
        return list(self.db.scalars(stmt).all())

    def list_items_by_location(self, location_id: uuid.UUID) -> List[InventoryItem]:
        stmt = (
            select(InventoryItem)
            .options(joinedload(InventoryItem.location))
            .where(InventoryItem.location_id == location_id)
            .order_by(InventoryItem.created_at)
        )
        return list(self.db.scalars(stmt).all())

    def list_items_by_product_id(self, product_id: uuid.UUID) -> List[InventoryItem]:
        stmt = (
            select(InventoryItem)
            .join(ProductVariant, InventoryItem.variant_id == ProductVariant.id)
            .options(joinedload(InventoryItem.location))
            .where(ProductVariant.product_id == product_id)
        )
        return list(self.db.scalars(stmt).all())

    # ==========================================
    # Movement Operations
    # ==========================================
    def create_movement(self, movement: InventoryMovement) -> InventoryMovement:
        self.db.add(movement)
        self.db.flush()
        return movement

    def list_movements(
        self,
        variant_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        movement_type: Optional[MovementType] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        reference: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[InventoryMovement], int]:
        stmt = select(InventoryMovement)

        if variant_id:
            stmt = stmt.where(InventoryMovement.variant_id == variant_id)
        if location_id:
            stmt = stmt.where(
                or_(
                    InventoryMovement.from_location_id == location_id,
                    InventoryMovement.to_location_id == location_id,
                )
            )
        if movement_type:
            stmt = stmt.where(InventoryMovement.movement_type == movement_type)
        if date_from:
            stmt = stmt.where(InventoryMovement.created_at >= date_from)
        if date_to:
            stmt = stmt.where(InventoryMovement.created_at <= date_to)
        if reference:
            stmt = stmt.where(InventoryMovement.reference.ilike(f"%{reference.strip()}%"))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = self.db.scalar(count_stmt) or 0

        stmt = stmt.options(
            joinedload(InventoryMovement.from_location),
            joinedload(InventoryMovement.to_location),
        )
        offset = (page - 1) * limit
        stmt = stmt.order_by(InventoryMovement.created_at.desc()).offset(offset).limit(limit)

        items = list(self.db.scalars(stmt).all())
        return items, total_count
