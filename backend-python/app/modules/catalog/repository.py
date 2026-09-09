import uuid
from decimal import Decimal
from typing import List, Optional, Tuple, Type, TypeVar
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database.base import Base
from app.modules.catalog.models import (
    Category,
    Collection,
    Color,
    Product,
    ProductImage,
    ProductVariant,
    Season,
    Size,
    Supplier,
)

ModelType = TypeVar("ModelType", bound=Base)


class CatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==========================================
    # Generic Helpers for Lookup Tables
    # ==========================================
    def get_by_id(self, model: Type[ModelType], entity_id: uuid.UUID) -> Optional[ModelType]:
        stmt = select(model).where(model.id == entity_id)
        return self.db.scalars(stmt).first()

    def list_all(self, model: Type[ModelType], order_by_col=None) -> List[ModelType]:
        stmt = select(model)
        if order_by_col is not None:
            stmt = stmt.order_by(order_by_col)
        return list(self.db.scalars(stmt).all())

    def create(self, entity: ModelType) -> ModelType:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: ModelType) -> ModelType:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity: ModelType) -> None:
        self.db.delete(entity)
        self.db.commit()

    # ==========================================
    # Specific Finders for Constraints
    # ==========================================
    def find_category_by_name(self, name: str) -> Optional[Category]:
        stmt = select(Category).where(func.lower(Category.name) == name.lower().strip())
        return self.db.scalars(stmt).first()

    def find_collection_by_name(self, name: str) -> Optional[Collection]:
        stmt = select(Collection).where(func.lower(Collection.name) == name.lower().strip())
        return self.db.scalars(stmt).first()

    def find_season_by_name_and_year(self, name: str, year: int) -> Optional[Season]:
        stmt = select(Season).where(
            func.lower(Season.name) == name.lower().strip(),
            Season.year == year,
        )
        return self.db.scalars(stmt).first()

    def find_supplier_by_name(self, name: str) -> Optional[Supplier]:
        stmt = select(Supplier).where(func.lower(Supplier.name) == name.lower().strip())
        return self.db.scalars(stmt).first()

    def find_color_by_name(self, name: str) -> Optional[Color]:
        stmt = select(Color).where(func.lower(Color.name) == name.lower().strip())
        return self.db.scalars(stmt).first()

    def find_size_by_name(self, name: str) -> Optional[Size]:
        stmt = select(Size).where(func.lower(Size.name) == name.lower().strip())
        return self.db.scalars(stmt).first()

    # ==========================================
    # Product & Variants Operations
    # ==========================================
    def get_product_detail_by_id(self, product_id: uuid.UUID, only_active: bool = False) -> Optional[Product]:
        """Fetch complete product graph with category, collection, season, supplier, variants, colors, sizes, and images."""
        stmt = (
            select(Product)
            .options(
                joinedload(Product.category),
                joinedload(Product.collection),
                joinedload(Product.season),
                joinedload(Product.supplier),
                selectinload(Product.variants).joinedload(ProductVariant.color),
                selectinload(Product.variants).joinedload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.images),
            )
            .where(Product.id == product_id)
        )
        if only_active:
            stmt = stmt.where(Product.is_active == True)
        return self.db.scalars(stmt).first()

    def list_products(
        self,
        category_id: Optional[uuid.UUID] = None,
        collection_id: Optional[uuid.UUID] = None,
        season_id: Optional[uuid.UUID] = None,
        color_id: Optional[uuid.UUID] = None,
        size_id: Optional[uuid.UUID] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        search: Optional[str] = None,
        only_active: bool = True,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Product], int]:
        """List products with dynamic filtering, anti-N+1 eager loading, and pagination."""
        stmt = select(Product).distinct()

        # Join variants if filtering by variant attributes (color, size, price)
        if color_id or size_id or min_price is not None or max_price is not None:
            stmt = stmt.join(Product.variants)

        # Filters
        if only_active:
            stmt = stmt.where(Product.is_active == True)
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)
        if collection_id:
            stmt = stmt.where(Product.collection_id == collection_id)
        if season_id:
            stmt = stmt.where(Product.season_id == season_id)
        if color_id:
            stmt = stmt.where(ProductVariant.color_id == color_id)
        if size_id:
            stmt = stmt.where(ProductVariant.size_id == size_id)
        if min_price is not None:
            stmt = stmt.where(ProductVariant.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(ProductVariant.price <= max_price)
        if search:
            search_pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.description.ilike(search_pattern),
                )
            )

        # Count total matching products
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = self.db.scalar(count_stmt) or 0

        # Eager load relationships for the current page
        stmt = stmt.options(
            joinedload(Product.category),
            joinedload(Product.collection),
            joinedload(Product.season),
            joinedload(Product.supplier),
            selectinload(Product.variants).joinedload(ProductVariant.color),
            selectinload(Product.variants).joinedload(ProductVariant.size),
            selectinload(Product.variants).selectinload(ProductVariant.images),
        )

        # Pagination & Sorting
        offset = (page - 1) * limit
        stmt = stmt.order_by(Product.created_at.desc()).offset(offset).limit(limit)

        items = list(self.db.scalars(stmt).unique().all())
        return items, total_count

    def find_variant_by_sku(self, sku: str) -> Optional[ProductVariant]:
        stmt = select(ProductVariant).where(ProductVariant.sku == sku.upper().strip())
        return self.db.scalars(stmt).first()

    def find_variant_by_combination(
        self, product_id: uuid.UUID, color_id: uuid.UUID, size_id: uuid.UUID
    ) -> Optional[ProductVariant]:
        stmt = select(ProductVariant).where(
            ProductVariant.product_id == product_id,
            ProductVariant.color_id == color_id,
            ProductVariant.size_id == size_id,
        )
        return self.db.scalars(stmt).first()

    def get_variant_by_id(self, variant_id: uuid.UUID) -> Optional[ProductVariant]:
        stmt = (
            select(ProductVariant)
            .options(
                joinedload(ProductVariant.color),
                joinedload(ProductVariant.size),
                selectinload(ProductVariant.images),
            )
            .where(ProductVariant.id == variant_id)
        )
        return self.db.scalars(stmt).first()

    def get_primary_image_for_variant(self, variant_id: uuid.UUID) -> Optional[ProductImage]:
        stmt = select(ProductImage).where(
            ProductImage.variant_id == variant_id,
            ProductImage.is_primary == True,
        )
        return self.db.scalars(stmt).first()
