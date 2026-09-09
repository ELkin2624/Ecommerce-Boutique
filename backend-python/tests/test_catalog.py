import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.database.seed import seed_catalog, seed_roles
from app.modules.auth.models import Role, User
from app.modules.catalog.models import (
    Category,
    Collection,
    Color,
    Product,
    ProductVariant,
    Season,
    Size,
    Supplier,
)


@pytest.fixture
def admin_token(db_session: Session) -> str:
    """Create an admin user and return a signed JWT token."""
    admin_role = db_session.query(Role).filter(Role.name == "ADMIN").first()
    admin_user = User(
        email=f"admin_{uuid.uuid4().hex[:6]}@fashionstore.com",
        password_hash=hash_password("AdminSecure123!"),
        first_name="Admin",
        last_name="Catalog",
        role_id=admin_role.id,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    return create_access_token(data={"sub": str(admin_user.id), "role": admin_role.name})


@pytest.fixture
def customer_token(db_session: Session) -> str:
    """Create a customer user and return a signed JWT token."""
    cust_role = db_session.query(Role).filter(Role.name == "CUSTOMER").first()
    cust_user = User(
        email=f"customer_{uuid.uuid4().hex[:6]}@fashionstore.com",
        password_hash=hash_password("CustomerSecure123!"),
        first_name="Customer",
        last_name="Buyer",
        role_id=cust_role.id,
    )
    db_session.add(cust_user)
    db_session.commit()
    db_session.refresh(cust_user)
    return create_access_token(data={"sub": str(cust_user.id), "role": cust_role.name})


@pytest.fixture
def catalog_fixtures(db_session: Session) -> dict:
    """Ensure seeds exist and return lookup entity instances."""
    seed_catalog(db_session)
    category = db_session.query(Category).filter(Category.name == "Vestidos").first()
    collection = db_session.query(Collection).filter(Collection.name == "Gala Elegance").first()
    season = db_session.query(Season).filter(Season.name == "Primavera - Verano").first()
    supplier = db_session.query(Supplier).filter(Supplier.name == "Textiles Andinos S.A.").first()
    color_black = db_session.query(Color).filter(Color.name == "Negro").first()
    color_red = db_session.query(Color).filter(Color.name == "Rojo Rubí").first()
    size_m = db_session.query(Size).filter(Size.name == "M").first()
    size_s = db_session.query(Size).filter(Size.name == "S").first()

    return {
        "category": category,
        "collection": collection,
        "season": season,
        "supplier": supplier,
        "color_black": color_black,
        "color_red": color_red,
        "size_m": size_m,
        "size_s": size_s,
    }


# ====================================================================
# 1. PRODUCT CRUD & RBAC SECURITY TESTS
# ====================================================================

def test_create_product_admin(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test admin can successfully create a product with nested variants and images."""
    f = catalog_fixtures
    payload = {
        "name": "Vestido Gala Noche",
        "description": "Vestido largo elegante con acabados de seda",
        "category_id": str(f["category"].id),
        "collection_id": str(f["collection"].id),
        "season_id": str(f["season"].id),
        "supplier_id": str(f["supplier"].id),
        "is_active": True,
        "variants": [
            {
                "color_id": str(f["color_black"].id),
                "size_id": str(f["size_m"].id),
                "price": 299.99,
                "images": [
                    {
                        "url": "https://fashionstore.com/images/vestido_negro_front.jpg",
                        "is_primary": True,
                        "sort_order": 0,
                        "alt_text": "Vestido Negro Frente",
                    }
                ],
            }
        ],
    }
    response = client.post(
        "/api/v1/catalog/products",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Vestido Gala Noche"
    assert data["category"]["name"] == "Vestidos"
    assert len(data["variants"]) == 1
    variant = data["variants"][0]
    assert variant["color"]["name"] == "Negro"
    assert variant["size"]["name"] == "M"
    assert float(variant["price"]) == 299.99
    assert variant["sku"].startswith("FS-")
    assert len(variant["images"]) == 1
    assert variant["images"][0]["is_primary"] is True


def test_create_product_customer_forbidden(client: TestClient, customer_token: str, catalog_fixtures: dict):
    """Test non-admin CUSTOMER role gets 403 Forbidden when creating a product."""
    f = catalog_fixtures
    payload = {
        "name": "Intento no autorizado",
        "category_id": str(f["category"].id),
    }
    response = client.post(
        "/api/v1/catalog/products",
        json=payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403


def test_create_product_unauthenticated(client: TestClient, catalog_fixtures: dict):
    """Test unauthenticated request gets 401 Unauthorized."""
    f = catalog_fixtures
    payload = {
        "name": "Intento sin token",
        "category_id": str(f["category"].id),
    }
    response = client.post("/api/v1/catalog/products", json=payload)
    assert response.status_code == 401


def test_update_product(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test admin can update product attributes."""
    f = catalog_fixtures
    # Create product first
    create_res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Blusa Seda", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_res.json()["id"]

    # Update
    update_res = client.put(
        f"/api/v1/catalog/products/{product_id}",
        json={"name": "Blusa Seda Italiana", "description": "100% pura seda"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Blusa Seda Italiana"
    assert update_res.json()["description"] == "100% pura seda"


def test_deactivate_product(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test soft delete / deactivation of product."""
    f = catalog_fixtures
    create_res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Prenda Descontinuada", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_res.json()["id"]

    delete_res = client.delete(
        f"/api/v1/catalog/products/{product_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_res.status_code == 200
    assert delete_res.json()["is_active"] is False


# ====================================================================
# 2. VARIANT & SKU INTEGRITY TESTS
# ====================================================================

def test_create_variant_deterministic_sku(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test variant SKU is automatically generated following deterministic pattern."""
    f = catalog_fixtures
    prod_res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Falda Plisada", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]

    var_res = client.post(
        f"/api/v1/catalog/products/{product_id}/variants",
        json={
            "color_id": str(f["color_black"].id),
            "size_id": str(f["size_m"].id),
            "price": 150.00,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert var_res.status_code == 201
    sku = var_res.json()["sku"]
    assert sku.startswith("FS-")
    assert "NEG" in sku
    assert "M" in sku


def test_create_variant_custom_sku(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test variant accepts valid custom SKU."""
    f = catalog_fixtures
    prod_res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Falda Tubo", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]

    var_res = client.post(
        f"/api/v1/catalog/products/{product_id}/variants",
        json={
            "color_id": str(f["color_red"].id),
            "size_id": str(f["size_s"].id),
            "price": 180.00,
            "sku": "CUSTOM-SKU-999",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert var_res.status_code == 201
    assert var_res.json()["sku"] == "CUSTOM-SKU-999"


def test_create_variant_duplicate_sku(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test duplicate SKU returns 409 Conflict."""
    f = catalog_fixtures
    prod_res1 = client.post(
        "/api/v1/catalog/products",
        json={"name": "Producto A", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    prod_res2 = client.post(
        "/api/v1/catalog/products",
        json={"name": "Producto B", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # First variant with custom SKU
    client.post(
        f"/api/v1/catalog/products/{prod_res1.json()['id']}/variants",
        json={"color_id": str(f["color_black"].id), "size_id": str(f["size_s"].id), "price": 100, "sku": "UNIQUE-SKU-1"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Second variant attempting same SKU
    res = client.post(
        f"/api/v1/catalog/products/{prod_res2.json()['id']}/variants",
        json={"color_id": str(f["color_black"].id), "size_id": str(f["size_s"].id), "price": 120, "sku": "UNIQUE-SKU-1"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 409
    assert "already in use" in res.json()["detail"].lower()


def test_create_variant_duplicate_combination(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test duplicate (product_id, color_id, size_id) returns 409 Conflict."""
    f = catalog_fixtures
    prod_res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Producto Duplicado Comb", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]

    # First combination
    client.post(
        f"/api/v1/catalog/products/{product_id}/variants",
        json={"color_id": str(f["color_black"].id), "size_id": str(f["size_m"].id), "price": 100},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Attempt duplicate combination
    res = client.post(
        f"/api/v1/catalog/products/{product_id}/variants",
        json={"color_id": str(f["color_black"].id), "size_id": str(f["size_m"].id), "price": 150},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()


def test_create_variant_invalid_price(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test price <= 0 returns validation error (422)."""
    f = catalog_fixtures
    prod_res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Producto Precio Cero", "category_id": str(f["category"].id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]

    res = client.post(
        f"/api/v1/catalog/products/{product_id}/variants",
        json={"color_id": str(f["color_black"].id), "size_id": str(f["size_m"].id), "price": 0.00},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 422


# ====================================================================
# 3. PUBLIC CATALOG, FILTERS & PAGINATION TESTS
# ====================================================================

def test_list_public_catalog_and_pagination(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test public catalog endpoint returns paginated products."""
    f = catalog_fixtures
    # Create two products
    client.post(
        "/api/v1/catalog/products",
        json={"name": "Vestido A", "category_id": str(f["category"].id), "is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client.post(
        "/api/v1/catalog/products",
        json={"name": "Vestido B", "category_id": str(f["category"].id), "is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Query public catalog
    res = client.get("/api/v1/catalog/products?page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["page"] == 1
    assert data["limit"] == 10
    assert data["total"] >= 2
    assert data["total_pages"] >= 1


def test_inactive_product_excluded_from_public_catalog(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test inactive products are omitted from public catalog query by default."""
    f = catalog_fixtures
    client.post(
        "/api/v1/catalog/products",
        json={"name": "Vestido Oculto", "category_id": str(f["category"].id), "is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.get("/api/v1/catalog/products?search=Vestido Oculto")
    assert res.status_code == 200
    assert len(res.json()["items"]) == 0


def test_filter_catalog_by_category_and_search(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test filtering by category and search keyword."""
    f = catalog_fixtures
    client.post(
        "/api/v1/catalog/products",
        json={
            "name": "Vestido Escote V Especial",
            "description": "Exclusivo para fiestas y celebraciones",
            "category_id": str(f["category"].id),
            "is_active": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Search by keyword
    res = client.get("/api/v1/catalog/products?search=Especial")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 1
    assert any("Especial" in item["name"] for item in items)

    # Filter by category
    res_cat = client.get(f"/api/v1/catalog/products?category_id={f['category'].id}")
    assert res_cat.status_code == 200
    assert all(item["category"]["id"] == str(f["category"].id) for item in res_cat.json()["items"])


def test_filter_catalog_by_price_range(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test filtering catalog by price range."""
    f = catalog_fixtures
    # Product with cheap variant
    client.post(
        "/api/v1/catalog/products",
        json={
            "name": "Prenda Economica",
            "category_id": str(f["category"].id),
            "variants": [{"color_id": str(f["color_black"].id), "size_id": str(f["size_s"].id), "price": 50.00}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    # Product with expensive variant
    client.post(
        "/api/v1/catalog/products",
        json={
            "name": "Prenda Lujo",
            "category_id": str(f["category"].id),
            "variants": [{"color_id": str(f["color_red"].id), "size_id": str(f["size_m"].id), "price": 500.00}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Filter min_price=400
    res = client.get("/api/v1/catalog/products?min_price=400")
    assert res.status_code == 200
    names = [p["name"] for p in res.json()["items"]]
    assert "Prenda Lujo" in names
    assert "Prenda Economica" not in names


# ====================================================================
# 4. IMAGE MANAGEMENT & PRIMARY FLAG TESTS
# ====================================================================

def test_image_primary_replacement(client: TestClient, admin_token: str, catalog_fixtures: dict):
    """Test adding a second primary image unmarks the previous primary image."""
    f = catalog_fixtures
    prod_res = client.post(
        "/api/v1/catalog/products",
        json={
            "name": "Vestido Fotos",
            "category_id": str(f["category"].id),
            "variants": [{"color_id": str(f["color_black"].id), "size_id": str(f["size_m"].id), "price": 100.00}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    variant_id = prod_res.json()["variants"][0]["id"]

    # Add first image as primary
    img1_res = client.post(
        f"/api/v1/catalog/variants/{variant_id}/images",
        json={"url": "https://img.com/1.jpg", "is_primary": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    img1_id = img1_res.json()["id"]

    # Add second image as primary
    img2_res = client.post(
        f"/api/v1/catalog/variants/{variant_id}/images",
        json={"url": "https://img.com/2.jpg", "is_primary": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Check variant images
    var_detail = client.get(f"/api/v1/catalog/products/{prod_res.json()['id']}").json()["variants"][0]
    images = var_detail["images"]
    assert len(images) == 2
    primary_images = [img for img in images if img["is_primary"]]
    assert len(primary_images) == 1
    assert primary_images[0]["url"] == "https://img.com/2.jpg"


# ====================================================================
# 5. METADATA INTEGRITY & UNIQUE CONSTRAINTS
# ====================================================================

def test_duplicate_category_name(client: TestClient, admin_token: str):
    """Test creating a category with duplicate name returns 409 Conflict."""
    name = f"Cat_{uuid.uuid4().hex[:6]}"
    res1 = client.post(
        "/api/v1/catalog/categories",
        json={"name": name},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res1.status_code == 201

    res2 = client.post(
        "/api/v1/catalog/categories",
        json={"name": name},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res2.status_code == 409


def test_duplicate_season_name_and_year(client: TestClient, admin_token: str):
    """Test creating a season with duplicate (name, year) returns 409 Conflict."""
    season_name = f"Season_{uuid.uuid4().hex[:4]}"
    res1 = client.post(
        "/api/v1/catalog/seasons",
        json={"name": season_name, "year": 2027},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res1.status_code == 201

    res2 = client.post(
        "/api/v1/catalog/seasons",
        json={"name": season_name, "year": 2027},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res2.status_code == 409


def test_invalid_category_foreign_key(client: TestClient, admin_token: str):
    """Test creating product with non-existent category returns 404."""
    res = client.post(
        "/api/v1/catalog/products",
        json={"name": "Producto Sin Categoria", "category_id": str(uuid.uuid4())},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 404
