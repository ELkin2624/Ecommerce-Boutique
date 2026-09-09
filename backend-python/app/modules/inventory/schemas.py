import uuid
from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

from app.modules.inventory.models import LocationType, MovementType

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    limit: int
    total: int
    total_pages: int


# ==========================================
# Location Schemas
# ==========================================
class InventoryLocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    type: LocationType
    address: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    is_active: bool = True


class InventoryLocationCreate(InventoryLocationBase):
    pass


class InventoryLocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    type: Optional[LocationType] = None
    address: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    is_active: Optional[bool] = None


class InventoryLocationResponse(InventoryLocationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Inventory Item Schemas
# ==========================================
class InventoryItemResponse(BaseModel):
    id: uuid.UUID
    variant_id: uuid.UUID
    location_id: uuid.UUID
    quantity: int
    reserved_quantity: int
    available_quantity: int
    location: InventoryLocationResponse
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Movement Request Schemas
# ==========================================
class InitialStockCreate(BaseModel):
    variant_id: uuid.UUID
    location_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None


class PurchaseMovementCreate(BaseModel):
    variant_id: uuid.UUID
    to_location_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class SaleMovementCreate(BaseModel):
    variant_id: uuid.UUID
    from_location_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class TransferMovementCreate(BaseModel):
    variant_id: uuid.UUID
    from_location_id: uuid.UUID
    to_location_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class AdjustmentMovementCreate(BaseModel):
    variant_id: uuid.UUID
    location_id: uuid.UUID
    quantity_delta: int = Field(..., gt=0)
    is_positive: bool = Field(..., description="True for positive adjustment (increase), False for negative (decrease)")
    reference: Optional[str] = Field(None, max_length=100)
    notes: str = Field(..., min_length=3, description="Mandatory audit justification notes")


class ReturnMovementCreate(BaseModel):
    variant_id: uuid.UUID
    to_location_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


# ==========================================
# Movement Response Schema
# ==========================================
class InventoryMovementResponse(BaseModel):
    id: uuid.UUID
    variant_id: uuid.UUID
    from_location_id: Optional[uuid.UUID] = None
    to_location_id: Optional[uuid.UUID] = None
    quantity: int
    movement_type: MovementType
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    from_location: Optional[InventoryLocationResponse] = None
    to_location: Optional[InventoryLocationResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Public Availability Schemas
# ==========================================
class LocationAvailabilityResponse(BaseModel):
    location_id: uuid.UUID
    location_name: str
    type: LocationType
    available_quantity: int


class PublicVariantAvailabilityResponse(BaseModel):
    variant_id: uuid.UUID
    total_available: int
    locations: List[LocationAvailabilityResponse]


class PublicProductAvailabilityResponse(BaseModel):
    product_id: uuid.UUID
    variants: List[PublicVariantAvailabilityResponse]
