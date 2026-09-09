import math
import uuid
from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database.session import get_db
from app.modules.auth.models import User
from app.modules.inventory.models import InventoryLocation, MovementType
from app.modules.inventory.repository import InventoryRepository
from app.modules.inventory.schemas import (
    AdjustmentMovementCreate,
    InitialStockCreate,
    InventoryItemResponse,
    InventoryLocationCreate,
    InventoryLocationResponse,
    InventoryLocationUpdate,
    InventoryMovementResponse,
    PaginatedResponse,
    PublicProductAvailabilityResponse,
    PublicVariantAvailabilityResponse,
    PurchaseMovementCreate,
    ReturnMovementCreate,
    SaleMovementCreate,
    TransferMovementCreate,
)
from app.modules.inventory.service import InventoryService

router = APIRouter()


def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    repository = InventoryRepository(db)
    return InventoryService(repository)


# ====================================================================
# 1. PUBLIC AVAILABILITY ENDPOINTS
# ====================================================================

@router.get(
    "/public/availability/{variant_id}",
    response_model=PublicVariantAvailabilityResponse,
    summary="Get public stock availability for a single variant across all active locations",
)
def get_public_variant_availability(
    variant_id: uuid.UUID,
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.get_public_variant_availability(variant_id)


@router.get(
    "/public/product-availability/{product_id}",
    response_model=PublicProductAvailabilityResponse,
    summary="Get public stock availability for all variants of a product",
)
def get_public_product_availability(
    product_id: uuid.UUID,
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.get_public_product_availability(product_id)


# ====================================================================
# 2. LOCATION MANAGEMENT (ADMIN / BRANCH_MANAGER)
# ====================================================================

@router.get(
    "/locations",
    response_model=List[InventoryLocationResponse],
    summary="List inventory locations (Admin / Branch Manager)",
)
def list_locations(
    only_active: bool = Query(False, description="Filter active locations only"),
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.list_locations(only_active=only_active)


@router.post(
    "/locations",
    response_model=InventoryLocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new physical inventory location (Admin only)",
)
def create_location(
    data: InventoryLocationCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.create_location(data)


@router.put(
    "/locations/{location_id}",
    response_model=InventoryLocationResponse,
    summary="Update inventory location details (Admin only)",
)
def update_location(
    location_id: uuid.UUID,
    data: InventoryLocationUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.update_location(location_id, data)


@router.delete(
    "/locations/{location_id}",
    response_model=InventoryLocationResponse,
    summary="Deactivate inventory location (Admin only)",
)
def deactivate_location(
    location_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.deactivate_location(location_id)


# ====================================================================
# 3. STOCK QUERY ENDPOINTS (ADMIN / BRANCH_MANAGER)
# ====================================================================

@router.get(
    "/stock/variant/{variant_id}",
    response_model=List[InventoryItemResponse],
    summary="Get internal stock distribution of a variant across all locations",
)
def get_stock_by_variant(
    variant_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.get_stock_by_variant(variant_id)


@router.get(
    "/stock/location/{location_id}",
    response_model=List[InventoryItemResponse],
    summary="Get all inventory items stored at a specific location",
)
def get_stock_by_location(
    location_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.get_stock_by_location(location_id)


# ====================================================================
# 4. INVENTORY MOVEMENTS (TRANSACTIONAL MUTATIONS)
# ====================================================================

@router.post(
    "/movements/initial",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Set initial stock for a variant at a location (Admin only)",
)
def initial_stock(
    data: InitialStockCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.initialize_stock(data, user_id=current_user.id)


@router.post(
    "/movements/purchase",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register stock purchase entry from supplier (Admin / Branch Manager)",
)
def register_purchase(
    data: PurchaseMovementCreate,
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.register_purchase(data, user_id=current_user.id)


@router.post(
    "/movements/sale",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register stock reduction due to sale (Admin / Branch Manager / Cashier)",
)
def register_sale(
    data: SaleMovementCreate,
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER", "CASHIER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.register_sale(data, user_id=current_user.id)


@router.post(
    "/movements/transfer",
    status_code=status.HTTP_201_CREATED,
    summary="Transfer stock atomically between two locations (Admin / Branch Manager)",
)
def transfer_stock(
    data: TransferMovementCreate,
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    source_item, dest_item = service.transfer_stock(data, user_id=current_user.id)
    return {
        "message": "Stock transfer completed successfully",
        "variant_id": data.variant_id,
        "quantity_transferred": data.quantity,
        "source_location": {
            "location_id": source_item.location_id,
            "new_quantity": source_item.quantity,
            "available_quantity": source_item.available_quantity,
        },
        "destination_location": {
            "location_id": dest_item.location_id,
            "new_quantity": dest_item.quantity,
            "available_quantity": dest_item.available_quantity,
        },
    }


@router.post(
    "/movements/adjustment",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Perform inventory audit adjustment (Admin only)",
)
def adjust_stock(
    data: AdjustmentMovementCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.adjust_stock(data, user_id=current_user.id)


@router.post(
    "/movements/return",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register customer product return into inventory (Admin / Branch Manager)",
)
def register_return(
    data: ReturnMovementCreate,
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    return service.register_return(data, user_id=current_user.id)


@router.get(
    "/movements",
    response_model=PaginatedResponse[InventoryMovementResponse],
    summary="List audit movements ledger with filters and pagination",
)
def list_movements(
    variant_id: Optional[uuid.UUID] = Query(None, description="Filter by variant ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by origin or destination location ID"),
    movement_type: Optional[MovementType] = Query(None, description="Filter by movement type"),
    date_from: Optional[datetime] = Query(None, description="Filter from timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter to timestamp"),
    reference: Optional[str] = Query(None, description="Filter by reference"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role("ADMIN", "BRANCH_MANAGER")),
    service: InventoryService = Depends(get_inventory_service),
) -> Any:
    items, total = service.list_movements(
        variant_id=variant_id,
        location_id=location_id,
        movement_type=movement_type,
        date_from=date_from,
        date_to=date_to,
        reference=reference,
        page=page,
        limit=limit,
    )
    total_pages = math.ceil(total / limit) if limit > 0 else 1
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
    }
