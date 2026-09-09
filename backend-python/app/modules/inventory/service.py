import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.modules.catalog.models import Product, ProductVariant
from app.modules.inventory.models import (
    InventoryItem,
    InventoryLocation,
    InventoryMovement,
    MovementType,
)
from app.modules.inventory.repository import InventoryRepository
from app.modules.inventory.schemas import (
    AdjustmentMovementCreate,
    InitialStockCreate,
    InventoryLocationCreate,
    InventoryLocationUpdate,
    LocationAvailabilityResponse,
    PublicProductAvailabilityResponse,
    PublicVariantAvailabilityResponse,
    PurchaseMovementCreate,
    ReturnMovementCreate,
    SaleMovementCreate,
    TransferMovementCreate,
)


class InventoryService:
    def __init__(self, repository: InventoryRepository):
        self.repository = repository

    # ==========================================
    # Location Management
    # ==========================================
    def create_location(self, data: InventoryLocationCreate) -> InventoryLocation:
        existing = self.repository.find_location_by_name(data.name)
        if existing:
            raise ConflictException(detail=f"Location '{data.name}' already exists")
        location = InventoryLocation(
            name=data.name.strip(),
            type=data.type,
            address=data.address.strip() if data.address else None,
            phone=data.phone.strip() if data.phone else None,
            is_active=data.is_active,
        )
        return self.repository.create_location(location)

    def list_locations(self, only_active: bool = False) -> List[InventoryLocation]:
        return self.repository.list_locations(only_active=only_active)

    def get_location(self, location_id: uuid.UUID) -> InventoryLocation:
        location = self.repository.get_location_by_id(location_id)
        if not location:
            raise NotFoundException(detail="Inventory location not found")
        return location

    def update_location(self, location_id: uuid.UUID, data: InventoryLocationUpdate) -> InventoryLocation:
        location = self.get_location(location_id)
        if data.name and data.name.strip().lower() != location.name.lower():
            existing = self.repository.find_location_by_name(data.name)
            if existing and existing.id != location_id:
                raise ConflictException(detail=f"Location '{data.name}' already exists")
            location.name = data.name.strip()
        if data.type is not None:
            location.type = data.type
        if data.address is not None:
            location.address = data.address.strip() if data.address else None
        if data.phone is not None:
            location.phone = data.phone.strip() if data.phone else None
        if data.is_active is not None:
            location.is_active = data.is_active
        return self.repository.update_location(location)

    def deactivate_location(self, location_id: uuid.UUID) -> InventoryLocation:
        location = self.get_location(location_id)
        location.is_active = False
        return self.repository.update_location(location)

    # ==========================================
    # Validation Helpers
    # ==========================================
    def _validate_variant_exists(self, variant_id: uuid.UUID) -> ProductVariant:
        stmt = select(ProductVariant).where(ProductVariant.id == variant_id)
        variant = self.repository.db.scalars(stmt).first()
        if not variant:
            raise NotFoundException(detail="Product variant not found")
        return variant

    def _validate_location_active(self, location_id: uuid.UUID) -> InventoryLocation:
        location = self.get_location(location_id)
        if not location.is_active:
            raise BadRequestException(detail=f"Location '{location.name}' is inactive")
        return location

    # ==========================================
    # Transactional Stock Movements (Pessimistic Locking)
    # ==========================================
    def initialize_stock(self, data: InitialStockCreate, user_id: Optional[uuid.UUID]) -> InventoryItem:
        self._validate_variant_exists(data.variant_id)
        self._validate_location_active(data.location_id)

        try:
            item = self.repository.get_inventory_item(data.variant_id, data.location_id, for_update=True)
            if item and item.quantity > 0:
                raise ConflictException(
                    detail="Initial stock already set for this variant at this location. Use adjustment instead."
                )

            if not item:
                item = InventoryItem(
                    variant_id=data.variant_id,
                    location_id=data.location_id,
                    quantity=data.quantity,
                    reserved_quantity=0,
                )
                self.repository.create_inventory_item(item)
            else:
                item.quantity = data.quantity

            movement = InventoryMovement(
                variant_id=data.variant_id,
                from_location_id=None,
                to_location_id=data.location_id,
                quantity=data.quantity,
                movement_type=MovementType.INITIAL,
                notes=data.notes,
                created_by=user_id,
            )
            self.repository.create_movement(movement)
            self.repository.db.commit()
            self.repository.db.refresh(item)
            return item
        except Exception:
            self.repository.db.rollback()
            raise

    def register_purchase(self, data: PurchaseMovementCreate, user_id: Optional[uuid.UUID]) -> InventoryItem:
        self._validate_variant_exists(data.variant_id)
        self._validate_location_active(data.to_location_id)

        try:
            item = self.repository.get_inventory_item(data.variant_id, data.to_location_id, for_update=True)
            if not item:
                item = InventoryItem(
                    variant_id=data.variant_id,
                    location_id=data.to_location_id,
                    quantity=data.quantity,
                    reserved_quantity=0,
                )
                self.repository.create_inventory_item(item)
            else:
                item.quantity += data.quantity

            movement = InventoryMovement(
                variant_id=data.variant_id,
                from_location_id=None,
                to_location_id=data.to_location_id,
                quantity=data.quantity,
                movement_type=MovementType.PURCHASE,
                reference=data.reference,
                notes=data.notes,
                created_by=user_id,
            )
            self.repository.create_movement(movement)
            self.repository.db.commit()
            self.repository.db.refresh(item)
            return item
        except Exception:
            self.repository.db.rollback()
            raise

    def register_sale(self, data: SaleMovementCreate, user_id: Optional[uuid.UUID]) -> InventoryItem:
        self._validate_variant_exists(data.variant_id)
        self._validate_location_active(data.from_location_id)

        try:
            item = self.repository.get_inventory_item(data.variant_id, data.from_location_id, for_update=True)
            if not item or item.available_quantity < data.quantity:
                avail = item.available_quantity if item else 0
                raise BadRequestException(
                    detail=f"Insufficient available stock at location. Available: {avail}, Requested: {data.quantity}"
                )

            item.quantity -= data.quantity

            movement = InventoryMovement(
                variant_id=data.variant_id,
                from_location_id=data.from_location_id,
                to_location_id=None,
                quantity=data.quantity,
                movement_type=MovementType.SALE,
                reference=data.reference,
                notes=data.notes,
                created_by=user_id,
            )
            self.repository.create_movement(movement)
            self.repository.db.commit()
            self.repository.db.refresh(item)
            return item
        except Exception:
            self.repository.db.rollback()
            raise

    def transfer_stock(
        self, data: TransferMovementCreate, user_id: Optional[uuid.UUID]
    ) -> Tuple[InventoryItem, InventoryItem]:
        if data.from_location_id == data.to_location_id:
            raise BadRequestException(detail="Source and destination locations cannot be the same")

        self._validate_variant_exists(data.variant_id)
        self._validate_location_active(data.from_location_id)
        self._validate_location_active(data.to_location_id)

        try:
            # Pessimistic lock on source
            source_item = self.repository.get_inventory_item(
                data.variant_id, data.from_location_id, for_update=True
            )
            if not source_item or source_item.available_quantity < data.quantity:
                avail = source_item.available_quantity if source_item else 0
                raise BadRequestException(
                    detail=f"Insufficient available stock at source location. Available: {avail}, Requested: {data.quantity}"
                )

            # Pessimistic lock on destination
            dest_item = self.repository.get_inventory_item(
                data.variant_id, data.to_location_id, for_update=True
            )
            if not dest_item:
                dest_item = InventoryItem(
                    variant_id=data.variant_id,
                    location_id=data.to_location_id,
                    quantity=data.quantity,
                    reserved_quantity=0,
                )
                self.repository.create_inventory_item(dest_item)
            else:
                dest_item.quantity += data.quantity

            source_item.quantity -= data.quantity

            movement = InventoryMovement(
                variant_id=data.variant_id,
                from_location_id=data.from_location_id,
                to_location_id=data.to_location_id,
                quantity=data.quantity,
                movement_type=MovementType.TRANSFER,
                reference=data.reference,
                notes=data.notes,
                created_by=user_id,
            )
            self.repository.create_movement(movement)
            self.repository.db.commit()
            self.repository.db.refresh(source_item)
            self.repository.db.refresh(dest_item)
            return source_item, dest_item
        except Exception:
            self.repository.db.rollback()
            raise

    def adjust_stock(self, data: AdjustmentMovementCreate, user_id: Optional[uuid.UUID]) -> InventoryItem:
        self._validate_variant_exists(data.variant_id)
        self._validate_location_active(data.location_id)

        try:
            item = self.repository.get_inventory_item(data.variant_id, data.location_id, for_update=True)

            if data.is_positive:
                if not item:
                    item = InventoryItem(
                        variant_id=data.variant_id,
                        location_id=data.location_id,
                        quantity=data.quantity_delta,
                        reserved_quantity=0,
                    )
                    self.repository.create_inventory_item(item)
                else:
                    item.quantity += data.quantity_delta
                from_loc = None
                to_loc = data.location_id
            else:
                if not item or item.available_quantity < data.quantity_delta:
                    avail = item.available_quantity if item else 0
                    raise BadRequestException(
                        detail=f"Cannot reduce stock below zero or reserved level. Available: {avail}, Adjustment: -{data.quantity_delta}"
                    )
                item.quantity -= data.quantity_delta
                from_loc = data.location_id
                to_loc = None

            movement = InventoryMovement(
                variant_id=data.variant_id,
                from_location_id=from_loc,
                to_location_id=to_loc,
                quantity=data.quantity_delta,
                movement_type=MovementType.ADJUSTMENT,
                reference=data.reference,
                notes=data.notes,
                created_by=user_id,
            )
            self.repository.create_movement(movement)
            self.repository.db.commit()
            self.repository.db.refresh(item)
            return item
        except Exception:
            self.repository.db.rollback()
            raise

    def register_return(self, data: ReturnMovementCreate, user_id: Optional[uuid.UUID]) -> InventoryItem:
        self._validate_variant_exists(data.variant_id)
        self._validate_location_active(data.to_location_id)

        try:
            item = self.repository.get_inventory_item(data.variant_id, data.to_location_id, for_update=True)
            if not item:
                item = InventoryItem(
                    variant_id=data.variant_id,
                    location_id=data.to_location_id,
                    quantity=data.quantity,
                    reserved_quantity=0,
                )
                self.repository.create_inventory_item(item)
            else:
                item.quantity += data.quantity

            movement = InventoryMovement(
                variant_id=data.variant_id,
                from_location_id=None,
                to_location_id=data.to_location_id,
                quantity=data.quantity,
                movement_type=MovementType.RETURN,
                reference=data.reference,
                notes=data.notes,
                created_by=user_id,
            )
            self.repository.create_movement(movement)
            self.repository.db.commit()
            self.repository.db.refresh(item)
            return item
        except Exception:
            self.repository.db.rollback()
            raise

    # ==========================================
    # Stock Queries & Availability
    # ==========================================
    def get_stock_by_variant(self, variant_id: uuid.UUID) -> List[InventoryItem]:
        self._validate_variant_exists(variant_id)
        return self.repository.list_items_by_variant(variant_id)

    def get_stock_by_location(self, location_id: uuid.UUID) -> List[InventoryItem]:
        self.get_location(location_id)
        return self.repository.list_items_by_location(location_id)

    def get_public_variant_availability(self, variant_id: uuid.UUID) -> PublicVariantAvailabilityResponse:
        self._validate_variant_exists(variant_id)
        items = self.repository.list_items_by_variant(variant_id)

        loc_avail_list = []
        total_avail = 0
        for item in items:
            if item.location.is_active and item.available_quantity > 0:
                total_avail += item.available_quantity
                loc_avail_list.append(
                    LocationAvailabilityResponse(
                        location_id=item.location_id,
                        location_name=item.location.name,
                        type=item.location.type,
                        available_quantity=item.available_quantity,
                    )
                )

        return PublicVariantAvailabilityResponse(
            variant_id=variant_id,
            total_available=total_avail,
            locations=loc_avail_list,
        )

    def get_public_product_availability(self, product_id: uuid.UUID) -> PublicProductAvailabilityResponse:
        stmt = select(Product).where(Product.id == product_id)
        product = self.repository.db.scalars(stmt).first()
        if not product:
            raise NotFoundException(detail="Product not found")

        stmt_variants = select(ProductVariant).where(ProductVariant.product_id == product_id)
        variants = list(self.repository.db.scalars(stmt_variants).all())

        variant_responses = [
            self.get_public_variant_availability(v.id) for v in variants
        ]

        return PublicProductAvailabilityResponse(
            product_id=product_id,
            variants=variant_responses,
        )

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
        if page < 1:
            page = 1
        if limit < 1:
            limit = 20
        if limit > 100:
            limit = 100
        return self.repository.list_movements(
            variant_id=variant_id,
            location_id=location_id,
            movement_type=movement_type,
            date_from=date_from,
            date_to=date_to,
            reference=reference,
            page=page,
            limit=limit,
        )

    # ==========================================
    # Order Orchestration (No internal commit)
    # ==========================================
    def reserve_stock(self, variant_id: uuid.UUID, location_id: uuid.UUID, quantity: int) -> InventoryItem:
        """Reserves stock for an order. Does NOT commit the transaction."""
        self._validate_variant_exists(variant_id)
        self._validate_location_active(location_id)
        
        item = self.repository.get_inventory_item(variant_id, location_id, for_update=True)
        if not item or item.available_quantity < quantity:
            avail = item.available_quantity if item else 0
            raise BadRequestException(
                detail=f"Insufficient available stock at location. Available: {avail}, Requested: {quantity}"
            )
            
        item.reserved_quantity += quantity
        return item

    def release_reserved_stock(self, variant_id: uuid.UUID, location_id: uuid.UUID, quantity: int) -> InventoryItem:
        """Releases reserved stock (e.g. order cancelled/expired). Does NOT commit."""
        item = self.repository.get_inventory_item(variant_id, location_id, for_update=True)
        if not item or item.reserved_quantity < quantity:
            res = item.reserved_quantity if item else 0
            raise BadRequestException(
                detail=f"Cannot release more than reserved stock. Reserved: {res}, Release requested: {quantity}"
            )
            
        item.reserved_quantity -= quantity
        return item

    def consume_reserved_stock(
        self, variant_id: uuid.UUID, location_id: uuid.UUID, quantity: int, reference: str, user_id: Optional[uuid.UUID] = None
    ) -> InventoryItem:
        """Consumes reserved stock (successful payment). Creates SALE movement. Does NOT commit."""
        item = self.repository.get_inventory_item(variant_id, location_id, for_update=True)
        if not item or item.reserved_quantity < quantity:
            res = item.reserved_quantity if item else 0
            raise BadRequestException(
                detail=f"Cannot consume more than reserved stock. Reserved: {res}, Consume requested: {quantity}"
            )
            
        item.reserved_quantity -= quantity
        item.quantity -= quantity

        movement = InventoryMovement(
            variant_id=variant_id,
            from_location_id=location_id,
            to_location_id=None,
            quantity=quantity,
            movement_type=MovementType.SALE,
            reference=reference,
            notes="Stock consumed from order checkout",
            created_by=user_id,
        )
        self.repository.create_movement(movement)
        return item
