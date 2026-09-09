import uuid
from datetime import datetime
from decimal import Decimal
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
import re


# ==========================================
# Generic Pagination Schema
# ==========================================
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    limit: int
    total: int
    total_pages: int


# ==========================================
# Category Schemas
# ==========================================
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Collection Schemas
# ==========================================
class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CollectionResponse(CollectionBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Season Schemas
# ==========================================
class SeasonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=2000, le=2100)


class SeasonCreate(SeasonBase):
    pass


class SeasonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    year: Optional[int] = Field(None, ge=2000, le=2100)


class SeasonResponse(SeasonBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Supplier Schemas
# ==========================================
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    contact_email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)


class SupplierResponse(SupplierBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Color Schemas
# ==========================================
class ColorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    hex_code: Optional[str] = Field(None, max_length=7)

    @field_validator("hex_code")
    @classmethod
    def validate_hex_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            if not re.match(r"^#([A-Fa-f0-9]{6})$", v):
                raise ValueError("hex_code must be in #RRGGBB format (e.g. #FF0000)")
        return v


class ColorCreate(ColorBase):
    pass


class ColorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    hex_code: Optional[str] = Field(None, max_length=7)

    @field_validator("hex_code")
    @classmethod
    def validate_hex_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            if not re.match(r"^#([A-Fa-f0-9]{6})$", v):
                raise ValueError("hex_code must be in #RRGGBB format (e.g. #FF0000)")
        return v


class ColorResponse(ColorBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Size Schemas
# ==========================================
class SizeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=20)
    sort_order: int = Field(0, ge=0)


class SizeCreate(SizeBase):
    pass


class SizeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=20)
    sort_order: Optional[int] = Field(None, ge=0)


class SizeResponse(SizeBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Product Image Schemas
# ==========================================
class ProductImageBase(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    is_primary: bool = False
    sort_order: int = Field(0, ge=0)
    alt_text: Optional[str] = Field(None, max_length=255)


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(ProductImageBase):
    id: uuid.UUID
    variant_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Product Variant Schemas
# ==========================================
class ProductVariantBase(BaseModel):
    color_id: uuid.UUID
    size_id: uuid.UUID
    price: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2)
    sku: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    images: Optional[List[ProductImageCreate]] = None


class ProductVariantUpdate(BaseModel):
    price: Optional[Decimal] = Field(None, gt=Decimal("0.00"), decimal_places=2)
    sku: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class ProductVariantResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    color_id: uuid.UUID
    size_id: uuid.UUID
    sku: str
    price: Decimal
    is_active: bool
    color: ColorResponse
    size: SizeResponse
    images: List[ProductImageResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Product Schemas
# ==========================================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: uuid.UUID
    collection_id: Optional[uuid.UUID] = None
    season_id: Optional[uuid.UUID] = None
    supplier_id: Optional[uuid.UUID] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    variants: Optional[List[ProductVariantCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    collection_id: Optional[uuid.UUID] = None
    season_id: Optional[uuid.UUID] = None
    supplier_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    category: CategoryResponse
    collection: Optional[CollectionResponse] = None
    season: Optional[SeasonResponse] = None
    supplier: Optional[SupplierResponse] = None
    variants: List[ProductVariantResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
