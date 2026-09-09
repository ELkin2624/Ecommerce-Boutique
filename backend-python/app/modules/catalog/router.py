import math
import uuid
from decimal import Decimal
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database.session import get_db
from app.modules.auth.models import User
from app.modules.catalog.models import Product
from app.modules.catalog.repository import CatalogRepository
from app.modules.catalog.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
    ColorCreate,
    ColorResponse,
    ColorUpdate,
    PaginatedResponse,
    ProductCreate,
    ProductDetailResponse,
    ProductImageCreate,
    ProductImageResponse,
    ProductResponse,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
    SeasonCreate,
    SeasonResponse,
    SeasonUpdate,
    SizeCreate,
    SizeResponse,
    SizeUpdate,
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from app.modules.catalog.service import CatalogService

router = APIRouter()


def get_catalog_service(db: Session = Depends(get_db)) -> CatalogService:
    repository = CatalogRepository(db)
    return CatalogService(repository)


# ====================================================================
# 1. PUBLIC & ADMIN PRODUCT ENDPOINTS
# ====================================================================

@router.get(
    "/products",
    response_model=PaginatedResponse[ProductDetailResponse],
    summary="List catalog products with filters and pagination",
)
def list_products(
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by Category ID"),
    collection_id: Optional[uuid.UUID] = Query(None, description="Filter by Collection ID"),
    season_id: Optional[uuid.UUID] = Query(None, description="Filter by Season ID"),
    color_id: Optional[uuid.UUID] = Query(None, description="Filter by Color ID"),
    size_id: Optional[uuid.UUID] = Query(None, description="Filter by Size ID"),
    min_price: Optional[Decimal] = Query(None, description="Minimum price filter", ge=0),
    max_price: Optional[Decimal] = Query(None, description="Maximum price filter", ge=0),
    search: Optional[str] = Query(None, description="Search term matching product name or description"),
    only_active: bool = Query(True, description="Filter active products only"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    items, total = service.list_products(
        category_id=category_id,
        collection_id=collection_id,
        season_id=season_id,
        color_id=color_id,
        size_id=size_id,
        min_price=min_price,
        max_price=max_price,
        search=search,
        only_active=only_active,
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


@router.get(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    summary="Get detailed product information by ID",
)
def get_product(
    product_id: uuid.UUID,
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.get_product_detail(product_id)


@router.post(
    "/products",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (Admin only)",
)
def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_product(product_in)


@router.put(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    summary="Update an existing product (Admin only)",
)
def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_product(product_id, product_in)


@router.delete(
    "/products/{product_id}",
    response_model=ProductResponse,
    summary="Deactivate a product (Admin only)",
)
def deactivate_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.deactivate_product(product_id)


# ====================================================================
# 2. VARIANT MANAGEMENT (ADMIN)
# ====================================================================

@router.post(
    "/products/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new variant to a product (Admin only)",
)
def create_variant(
    product_id: uuid.UUID,
    variant_in: ProductVariantCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_variant(product_id, variant_in)


@router.put(
    "/variants/{variant_id}",
    response_model=ProductVariantResponse,
    summary="Update a product variant (Admin only)",
)
def update_variant(
    variant_id: uuid.UUID,
    variant_in: ProductVariantUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_variant(variant_id, variant_in)


@router.delete(
    "/variants/{variant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product variant (Admin only)",
)
def delete_variant(
    variant_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_variant(variant_id)


# ====================================================================
# 3. IMAGE MANAGEMENT (ADMIN)
# ====================================================================

@router.post(
    "/variants/{variant_id}/images",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an image URL to a variant (Admin only)",
)
def add_image(
    variant_id: uuid.UUID,
    image_in: ProductImageCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.add_image_to_variant(variant_id, image_in)


@router.delete(
    "/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product image (Admin only)",
)
def delete_image(
    image_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_image(image_id)


# ====================================================================
# 4. CATEGORIES ENDPOINTS
# ====================================================================

@router.get("/categories", response_model=List[CategoryResponse], summary="List all categories")
def list_categories(service: CatalogService = Depends(get_catalog_service)) -> Any:
    return service.list_categories()


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category (Admin only)",
)
def create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_category(data)


@router.put(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Update category (Admin only)",
)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_category(category_id, data)


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete category (Admin only)",
)
def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_category(category_id)


# ====================================================================
# 5. COLLECTIONS ENDPOINTS
# ====================================================================

@router.get("/collections", response_model=List[CollectionResponse], summary="List all collections")
def list_collections(service: CatalogService = Depends(get_catalog_service)) -> Any:
    return service.list_collections()


@router.post(
    "/collections",
    response_model=CollectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create collection (Admin only)",
)
def create_collection(
    data: CollectionCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_collection(data)


@router.put(
    "/collections/{collection_id}",
    response_model=CollectionResponse,
    summary="Update collection (Admin only)",
)
def update_collection(
    collection_id: uuid.UUID,
    data: CollectionUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_collection(collection_id, data)


@router.delete(
    "/collections/{collection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete collection (Admin only)",
)
def delete_collection(
    collection_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_collection(collection_id)


# ====================================================================
# 6. SEASONS ENDPOINTS
# ====================================================================

@router.get("/seasons", response_model=List[SeasonResponse], summary="List all seasons")
def list_seasons(service: CatalogService = Depends(get_catalog_service)) -> Any:
    return service.list_seasons()


@router.post(
    "/seasons",
    response_model=SeasonResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create season (Admin only)",
)
def create_season(
    data: SeasonCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_season(data)


@router.put(
    "/seasons/{season_id}",
    response_model=SeasonResponse,
    summary="Update season (Admin only)",
)
def update_season(
    season_id: uuid.UUID,
    data: SeasonUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_season(season_id, data)


@router.delete(
    "/seasons/{season_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete season (Admin only)",
)
def delete_season(
    season_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_season(season_id)


# ====================================================================
# 7. SUPPLIERS ENDPOINTS
# ====================================================================

@router.get("/suppliers", response_model=List[SupplierResponse], summary="List all suppliers")
def list_suppliers(service: CatalogService = Depends(get_catalog_service)) -> Any:
    return service.list_suppliers()


@router.post(
    "/suppliers",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create supplier (Admin only)",
)
def create_supplier(
    data: SupplierCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_supplier(data)


@router.put(
    "/suppliers/{supplier_id}",
    response_model=SupplierResponse,
    summary="Update supplier (Admin only)",
)
def update_supplier(
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_supplier(supplier_id, data)


@router.delete(
    "/suppliers/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete supplier (Admin only)",
)
def delete_supplier(
    supplier_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_supplier(supplier_id)


# ====================================================================
# 8. COLORS ENDPOINTS
# ====================================================================

@router.get("/colors", response_model=List[ColorResponse], summary="List all colors")
def list_colors(service: CatalogService = Depends(get_catalog_service)) -> Any:
    return service.list_colors()


@router.post(
    "/colors",
    response_model=ColorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create color (Admin only)",
)
def create_color(
    data: ColorCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_color(data)


@router.put(
    "/colors/{color_id}",
    response_model=ColorResponse,
    summary="Update color (Admin only)",
)
def update_color(
    color_id: uuid.UUID,
    data: ColorUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_color(color_id, data)


@router.delete(
    "/colors/{color_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete color (Admin only)",
)
def delete_color(
    color_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_color(color_id)


# ====================================================================
# 9. SIZES ENDPOINTS
# ====================================================================

@router.get("/sizes", response_model=List[SizeResponse], summary="List all sizes")
def list_sizes(service: CatalogService = Depends(get_catalog_service)) -> Any:
    return service.list_sizes()


@router.post(
    "/sizes",
    response_model=SizeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create size (Admin only)",
)
def create_size(
    data: SizeCreate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.create_size(data)


@router.put(
    "/sizes/{size_id}",
    response_model=SizeResponse,
    summary="Update size (Admin only)",
)
def update_size(
    size_id: uuid.UUID,
    data: SizeUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> Any:
    return service.update_size(size_id, data)


@router.delete(
    "/sizes/{size_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete size (Admin only)",
)
def delete_size(
    size_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    service: CatalogService = Depends(get_catalog_service),
) -> None:
    service.delete_size(size_id)
