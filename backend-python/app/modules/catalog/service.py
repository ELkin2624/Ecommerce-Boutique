import hashlib
import re
import uuid
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
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
from app.modules.catalog.repository import CatalogRepository
from app.modules.catalog.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CollectionCreate,
    CollectionUpdate,
    ColorCreate,
    ColorUpdate,
    ProductCreate,
    ProductImageCreate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantUpdate,
    SeasonCreate,
    SeasonUpdate,
    SizeCreate,
    SizeUpdate,
    SupplierCreate,
    SupplierUpdate,
)


def generate_deterministic_sku(
    category_name: str,
    product_name: str,
    color_name: str,
    size_name: str,
    product_id: uuid.UUID,
    color_id: uuid.UUID,
    size_id: uuid.UUID,
) -> str:
    """Generate a stable, unique, and deterministic SKU.
    
    Format: FS-{CAT4}-{PROD6}-{COL3}-{SIZE4}-{HASH4}
    Example: FS-VEST-GALA01-NEG-M-7C2A
    """
    cat_clean = re.sub(r"[^A-Z0-9]", "", category_name.upper())[:4] or "GEN"
    prod_clean = re.sub(r"[^A-Z0-9]", "", product_name.upper())[:6] or "PROD"
    col_clean = re.sub(r"[^A-Z0-9]", "", color_name.upper())[:3] or "COL"
    size_clean = re.sub(r"[^A-Z0-9]", "", size_name.upper())[:4] or "UNI"

    # Deterministic hash based on entity UUIDs
    hash_seed = f"{product_id}-{color_id}-{size_id}"
    short_hash = hashlib.sha256(hash_seed.encode()).hexdigest()[:4].upper()

    return f"FS-{cat_clean}-{prod_clean}-{col_clean}-{size_clean}-{short_hash}"


class CatalogService:
    def __init__(self, repository: CatalogRepository):
        self.repository = repository

    # ==========================================
    # Category Management
    # ==========================================
    def create_category(self, data: CategoryCreate) -> Category:
        existing = self.repository.find_category_by_name(data.name)
        if existing:
            raise ConflictException(detail=f"Category '{data.name}' already exists")
        category = Category(name=data.name.strip(), description=data.description)
        return self.repository.create(category)

    def list_categories(self) -> List[Category]:
        return self.repository.list_all(Category, order_by_col=Category.name)

    def get_category(self, category_id: uuid.UUID) -> Category:
        category = self.repository.get_by_id(Category, category_id)
        if not category:
            raise NotFoundException(detail="Category not found")
        return category

    def update_category(self, category_id: uuid.UUID, data: CategoryUpdate) -> Category:
        category = self.get_category(category_id)
        if data.name and data.name.strip().lower() != category.name.lower():
            existing = self.repository.find_category_by_name(data.name)
            if existing and existing.id != category_id:
                raise ConflictException(detail=f"Category '{data.name}' already exists")
            category.name = data.name.strip()
        if data.description is not None:
            category.description = data.description
        return self.repository.update(category)

    def delete_category(self, category_id: uuid.UUID) -> None:
        category = self.get_category(category_id)
        self.repository.delete(category)

    # ==========================================
    # Collection Management
    # ==========================================
    def create_collection(self, data: CollectionCreate) -> Collection:
        existing = self.repository.find_collection_by_name(data.name)
        if existing:
            raise ConflictException(detail=f"Collection '{data.name}' already exists")
        collection = Collection(name=data.name.strip(), description=data.description)
        return self.repository.create(collection)

    def list_collections(self) -> List[Collection]:
        return self.repository.list_all(Collection, order_by_col=Collection.name)

    def get_collection(self, collection_id: uuid.UUID) -> Collection:
        collection = self.repository.get_by_id(Collection, collection_id)
        if not collection:
            raise NotFoundException(detail="Collection not found")
        return collection

    def update_collection(self, collection_id: uuid.UUID, data: CollectionUpdate) -> Collection:
        collection = self.get_collection(collection_id)
        if data.name and data.name.strip().lower() != collection.name.lower():
            existing = self.repository.find_collection_by_name(data.name)
            if existing and existing.id != collection_id:
                raise ConflictException(detail=f"Collection '{data.name}' already exists")
            collection.name = data.name.strip()
        if data.description is not None:
            collection.description = data.description
        return self.repository.update(collection)

    def delete_collection(self, collection_id: uuid.UUID) -> None:
        collection = self.get_collection(collection_id)
        self.repository.delete(collection)

    # ==========================================
    # Season Management
    # ==========================================
    def create_season(self, data: SeasonCreate) -> Season:
        existing = self.repository.find_season_by_name_and_year(data.name, data.year)
        if existing:
            raise ConflictException(detail=f"Season '{data.name}' ({data.year}) already exists")
        season = Season(name=data.name.strip(), year=data.year)
        return self.repository.create(season)

    def list_seasons(self) -> List[Season]:
        return self.repository.list_all(Season, order_by_col=Season.year.desc())

    def get_season(self, season_id: uuid.UUID) -> Season:
        season = self.repository.get_by_id(Season, season_id)
        if not season:
            raise NotFoundException(detail="Season not found")
        return season

    def update_season(self, season_id: uuid.UUID, data: SeasonUpdate) -> Season:
        season = self.get_season(season_id)
        new_name = data.name.strip() if data.name else season.name
        new_year = data.year if data.year is not None else season.year
        if new_name != season.name or new_year != season.year:
            existing = self.repository.find_season_by_name_and_year(new_name, new_year)
            if existing and existing.id != season_id:
                raise ConflictException(detail=f"Season '{new_name}' ({new_year}) already exists")
            season.name = new_name
            season.year = new_year
        return self.repository.update(season)

    def delete_season(self, season_id: uuid.UUID) -> None:
        season = self.get_season(season_id)
        self.repository.delete(season)

    # ==========================================
    # Supplier Management
    # ==========================================
    def create_supplier(self, data: SupplierCreate) -> Supplier:
        existing = self.repository.find_supplier_by_name(data.name)
        if existing:
            raise ConflictException(detail=f"Supplier '{data.name}' already exists")
        supplier = Supplier(
            name=data.name.strip(),
            contact_email=data.contact_email.lower().strip(),
            phone=data.phone.strip() if data.phone else None,
        )
        return self.repository.create(supplier)

    def list_suppliers(self) -> List[Supplier]:
        return self.repository.list_all(Supplier, order_by_col=Supplier.name)

    def get_supplier(self, supplier_id: uuid.UUID) -> Supplier:
        supplier = self.repository.get_by_id(Supplier, supplier_id)
        if not supplier:
            raise NotFoundException(detail="Supplier not found")
        return supplier

    def update_supplier(self, supplier_id: uuid.UUID, data: SupplierUpdate) -> Supplier:
        supplier = self.get_supplier(supplier_id)
        if data.name and data.name.strip().lower() != supplier.name.lower():
            existing = self.repository.find_supplier_by_name(data.name)
            if existing and existing.id != supplier_id:
                raise ConflictException(detail=f"Supplier '{data.name}' already exists")
            supplier.name = data.name.strip()
        if data.contact_email:
            supplier.contact_email = data.contact_email.lower().strip()
        if data.phone is not None:
            supplier.phone = data.phone.strip() if data.phone else None
        return self.repository.update(supplier)

    def delete_supplier(self, supplier_id: uuid.UUID) -> None:
        supplier = self.get_supplier(supplier_id)
        self.repository.delete(supplier)

    # ==========================================
    # Color Management
    # ==========================================
    def create_color(self, data: ColorCreate) -> Color:
        existing = self.repository.find_color_by_name(data.name)
        if existing:
            raise ConflictException(detail=f"Color '{data.name}' already exists")
        color = Color(
            name=data.name.strip(),
            hex_code=data.hex_code.upper().strip() if data.hex_code else None,
        )
        return self.repository.create(color)

    def list_colors(self) -> List[Color]:
        return self.repository.list_all(Color, order_by_col=Color.name)

    def get_color(self, color_id: uuid.UUID) -> Color:
        color = self.repository.get_by_id(Color, color_id)
        if not color:
            raise NotFoundException(detail="Color not found")
        return color

    def update_color(self, color_id: uuid.UUID, data: ColorUpdate) -> Color:
        color = self.get_color(color_id)
        if data.name and data.name.strip().lower() != color.name.lower():
            existing = self.repository.find_color_by_name(data.name)
            if existing and existing.id != color_id:
                raise ConflictException(detail=f"Color '{data.name}' already exists")
            color.name = data.name.strip()
        if data.hex_code is not None:
            color.hex_code = data.hex_code.upper().strip() if data.hex_code else None
        return self.repository.update(color)

    def delete_color(self, color_id: uuid.UUID) -> None:
        color = self.get_color(color_id)
        self.repository.delete(color)

    # ==========================================
    # Size Management
    # ==========================================
    def create_size(self, data: SizeCreate) -> Size:
        existing = self.repository.find_size_by_name(data.name)
        if existing:
            raise ConflictException(detail=f"Size '{data.name}' already exists")
        size = Size(name=data.name.strip(), sort_order=data.sort_order)
        return self.repository.create(size)

    def list_sizes(self) -> List[Size]:
        return self.repository.list_all(Size, order_by_col=Size.sort_order)

    def get_size(self, size_id: uuid.UUID) -> Size:
        size = self.repository.get_by_id(Size, size_id)
        if not size:
            raise NotFoundException(detail="Size not found")
        return size

    def update_size(self, size_id: uuid.UUID, data: SizeUpdate) -> Size:
        size = self.get_size(size_id)
        if data.name and data.name.strip().lower() != size.name.lower():
            existing = self.repository.find_size_by_name(data.name)
            if existing and existing.id != size_id:
                raise ConflictException(detail=f"Size '{data.name}' already exists")
            size.name = data.name.strip()
        if data.sort_order is not None:
            size.sort_order = data.sort_order
        return self.repository.update(size)

    def delete_size(self, size_id: uuid.UUID) -> None:
        size = self.get_size(size_id)
        self.repository.delete(size)

    # ==========================================
    # Product & Variants Management
    # ==========================================
    def create_product(self, data: ProductCreate) -> Product:
        # Validate foreign keys
        category = self.repository.get_by_id(Category, data.category_id)
        if not category:
            raise NotFoundException(detail="Category not found")

        if data.collection_id:
            collection = self.repository.get_by_id(Collection, data.collection_id)
            if not collection:
                raise NotFoundException(detail="Collection not found")

        if data.season_id:
            season = self.repository.get_by_id(Season, data.season_id)
            if not season:
                raise NotFoundException(detail="Season not found")

        if data.supplier_id:
            supplier = self.repository.get_by_id(Supplier, data.supplier_id)
            if not supplier:
                raise NotFoundException(detail="Supplier not found")

        new_product = Product(
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            category_id=data.category_id,
            collection_id=data.collection_id,
            season_id=data.season_id,
            supplier_id=data.supplier_id,
            is_active=data.is_active,
        )
        created_product = self.repository.create(new_product)

        # Handle nested variants if provided
        if data.variants:
            for variant_in in data.variants:
                self.create_variant(created_product.id, variant_in)

        return self.get_product_detail(created_product.id)

    def update_product(self, product_id: uuid.UUID, data: ProductUpdate) -> Product:
        product = self.repository.get_by_id(Product, product_id)
        if not product:
            raise NotFoundException(detail="Product not found")

        if data.category_id:
            category = self.repository.get_by_id(Category, data.category_id)
            if not category:
                raise NotFoundException(detail="Category not found")
            product.category_id = data.category_id

        if data.collection_id is not None:
            if data.collection_id:
                collection = self.repository.get_by_id(Collection, data.collection_id)
                if not collection:
                    raise NotFoundException(detail="Collection not found")
            product.collection_id = data.collection_id

        if data.season_id is not None:
            if data.season_id:
                season = self.repository.get_by_id(Season, data.season_id)
                if not season:
                    raise NotFoundException(detail="Season not found")
            product.season_id = data.season_id

        if data.supplier_id is not None:
            if data.supplier_id:
                supplier = self.repository.get_by_id(Supplier, data.supplier_id)
                if not supplier:
                    raise NotFoundException(detail="Supplier not found")
            product.supplier_id = data.supplier_id

        if data.name:
            product.name = data.name.strip()
        if data.description is not None:
            product.description = data.description
        if data.is_active is not None:
            product.is_active = data.is_active

        self.repository.update(product)
        return self.get_product_detail(product_id)

    def deactivate_product(self, product_id: uuid.UUID) -> Product:
        product = self.repository.get_by_id(Product, product_id)
        if not product:
            raise NotFoundException(detail="Product not found")
        product.is_active = False
        self.repository.update(product)
        return product

    def get_product_detail(self, product_id: uuid.UUID, only_active: bool = False) -> Product:
        product = self.repository.get_product_detail_by_id(product_id, only_active=only_active)
        if not product:
            raise NotFoundException(detail="Product not found")
        return product

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
        if page < 1:
            page = 1
        if limit < 1:
            limit = 20
        if limit > 100:
            limit = 100
        return self.repository.list_products(
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

    # ==========================================
    # Variant Specific Logic
    # ==========================================
    def create_variant(self, product_id: uuid.UUID, data: ProductVariantCreate) -> ProductVariant:
        product = self.repository.get_by_id(Product, product_id)
        if not product:
            raise NotFoundException(detail="Product not found")

        color = self.repository.get_by_id(Color, data.color_id)
        if not color:
            raise NotFoundException(detail="Color not found")

        size = self.repository.get_by_id(Size, data.size_id)
        if not size:
            raise NotFoundException(detail="Size not found")

        # Validate unique combination (product_id, color_id, size_id)
        existing_comb = self.repository.find_variant_by_combination(product_id, data.color_id, data.size_id)
        if existing_comb:
            raise ConflictException(
                detail=f"A variant with color '{color.name}' and size '{size.name}' already exists for this product"
            )

        # SKU generation or validation
        if data.sku and data.sku.strip():
            sku_to_use = data.sku.upper().strip()
            existing_sku = self.repository.find_variant_by_sku(sku_to_use)
            if existing_sku:
                raise ConflictException(detail=f"SKU '{sku_to_use}' is already in use")
        else:
            category = self.repository.get_by_id(Category, product.category_id)
            cat_name = category.name if category else "CAT"
            sku_to_use = generate_deterministic_sku(
                category_name=cat_name,
                product_name=product.name,
                color_name=color.name,
                size_name=size.name,
                product_id=product.id,
                color_id=color.id,
                size_id=size.id,
            )
            # Guarantee uniqueness
            existing_sku = self.repository.find_variant_by_sku(sku_to_use)
            if existing_sku:
                # If deterministic hash collides, append variant sequence suffix
                sku_to_use = f"{sku_to_use}-01"

        if data.price <= Decimal("0.00"):
            raise BadRequestException(detail="Variant price must be greater than 0")

        new_variant = ProductVariant(
            product_id=product_id,
            color_id=data.color_id,
            size_id=data.size_id,
            sku=sku_to_use,
            price=data.price,
            is_active=data.is_active,
        )
        created_variant = self.repository.create(new_variant)

        # Handle nested images
        if data.images:
            has_primary = False
            for img_in in data.images:
                is_prim = img_in.is_primary and not has_primary
                if is_prim:
                    has_primary = True
                image = ProductImage(
                    variant_id=created_variant.id,
                    url=img_in.url.strip(),
                    is_primary=is_prim,
                    sort_order=img_in.sort_order,
                    alt_text=img_in.alt_text.strip() if img_in.alt_text else None,
                )
                self.repository.create(image)

        return self.repository.get_variant_by_id(created_variant.id)

    def update_variant(self, variant_id: uuid.UUID, data: ProductVariantUpdate) -> ProductVariant:
        variant = self.repository.get_variant_by_id(variant_id)
        if not variant:
            raise NotFoundException(detail="Product variant not found")

        if data.price is not None:
            if data.price <= Decimal("0.00"):
                raise BadRequestException(detail="Variant price must be greater than 0")
            variant.price = data.price

        if data.sku:
            normalized_sku = data.sku.upper().strip()
            if normalized_sku != variant.sku:
                existing_sku = self.repository.find_variant_by_sku(normalized_sku)
                if existing_sku and existing_sku.id != variant_id:
                    raise ConflictException(detail=f"SKU '{normalized_sku}' is already in use")
                variant.sku = normalized_sku

        if data.is_active is not None:
            variant.is_active = data.is_active

        return self.repository.update(variant)

    def delete_variant(self, variant_id: uuid.UUID) -> None:
        variant = self.repository.get_variant_by_id(variant_id)
        if not variant:
            raise NotFoundException(detail="Product variant not found")
        self.repository.delete(variant)

    def get_variant(self, variant_id: uuid.UUID) -> ProductVariant:
        variant = self.repository.get_variant_by_id(variant_id)
        if not variant:
            raise NotFoundException(detail="Product variant not found")
        return variant

    # ==========================================
    # Product Image Management
    # ==========================================
    def add_image_to_variant(self, variant_id: uuid.UUID, data: ProductImageCreate) -> ProductImage:
        variant = self.repository.get_variant_by_id(variant_id)
        if not variant:
            raise NotFoundException(detail="Product variant not found")

        if data.is_primary:
            # Unmark other primary images for this variant
            for img in variant.images:
                if img.is_primary:
                    img.is_primary = False
                    self.repository.update(img)

        image = ProductImage(
            variant_id=variant_id,
            url=data.url.strip(),
            is_primary=data.is_primary,
            sort_order=data.sort_order,
            alt_text=data.alt_text.strip() if data.alt_text else None,
        )
        return self.repository.create(image)

    def delete_image(self, image_id: uuid.UUID) -> None:
        image = self.repository.get_by_id(ProductImage, image_id)
        if not image:
            raise NotFoundException(detail="Product image not found")
        self.repository.delete(image)
