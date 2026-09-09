import concurrent.futures
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.modules.auth.models import Role, User
from app.modules.catalog.models import (
    Category,
    Color,
    Product,
    ProductVariant,
    Size,
)
from app.modules.inventory.models import (
    InventoryItem,
    InventoryLocation,
    InventoryMovement,
    LocationType,
    MovementType,
)


@pytest.fixture
def admin_token(db_session: Session) -> str:
    admin_role = db_session.query(Role).filter(Role.name == "ADMIN").first()
    admin_user = User(
        email=f"admin_inv_{uuid.uuid4().hex[:6]}@fashionstore.com",
        password_hash=hash_password("AdminPass123!"),
        first_name="Admin",
        last_name="Inventory",
        role_id=admin_role.id,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    return create_access_token(data={"sub": str(admin_user.id), "role": admin_role.name})


@pytest.fixture
def branch_manager_token(db_session: Session) -> str:
    bm_role = db_session.query(Role).filter(Role.name == "BRANCH_MANAGER").first()
    bm_user = User(
        email=f"manager_inv_{uuid.uuid4().hex[:6]}@fashionstore.com",
        password_hash=hash_password("ManagerPass123!"),
        first_name="Branch",
        last_name="Manager",
        role_id=bm_role.id,
    )
    db_session.add(bm_user)
    db_session.commit()
    db_session.refresh(bm_user)
    return create_access_token(data={"sub": str(bm_user.id), "role": bm_role.name})


@pytest.fixture
def customer_token(db_session: Session) -> str:
    cust_role = db_session.query(Role).filter(Role.name == "CUSTOMER").first()
    cust_user = User(
        email=f"cust_inv_{uuid.uuid4().hex[:6]}@fashionstore.com",
        password_hash=hash_password("CustomerPass123!"),
        first_name="Customer",
        last_name="Buyer",
        role_id=cust_role.id,
    )
    db_session.add(cust_user)
    db_session.commit()
    db_session.refresh(cust_user)
    return create_access_token(data={"sub": str(cust_user.id), "role": cust_role.name})


@pytest.fixture
def inventory_fixtures(db_session: Session) -> dict:
    """Create test category, product, variant, and locations."""
    category = db_session.query(Category).filter(Category.name == "Vestidos").first()
    color_black = db_session.query(Color).filter(Color.name == "Negro").first()
    size_m = db_session.query(Size).filter(Size.name == "M").first()

    product = Product(
        name="Vestido Seda Noche",
        category_id=category.id,
        is_active=True,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    variant = ProductVariant(
        product_id=product.id,
        color_id=color_black.id,
        size_id=size_m.id,
        sku=f"FS-VEST-SEDA-NEG-M-{uuid.uuid4().hex[:4].upper()}",
        price=250.00,
        is_active=True,
    )
    db_session.add(variant)
    db_session.commit()
    db_session.refresh(variant)

    branch_sc = db_session.query(InventoryLocation).filter(InventoryLocation.name == "Sucursal Santa Cruz").first()
    branch_lp = db_session.query(InventoryLocation).filter(InventoryLocation.name == "Sucursal La Paz").first()
    warehouse = db_session.query(InventoryLocation).filter(InventoryLocation.name == "Almacén Central").first()

    return {
        "product": product,
        "variant": variant,
        "branch_sc": branch_sc,
        "branch_lp": branch_lp,
        "warehouse": warehouse,
    }


# ====================================================================
# 1. LOCATION TESTS
# ====================================================================

def test_create_branch_and_warehouse(client: TestClient, admin_token: str):
    """Test admin can create BRANCH and WAREHOUSE locations."""
    res_b = client.post(
        "/api/v1/inventory/locations",
        json={
            "name": f"Sucursal Cochabamba {uuid.uuid4().hex[:4]}",
            "type": "BRANCH",
            "address": "Av. Heroínas #340",
            "phone": "+59144223344",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_b.status_code == 201
    assert res_b.json()["type"] == "BRANCH"

    res_w = client.post(
        "/api/v1/inventory/locations",
        json={
            "name": f"Almacén Secundario {uuid.uuid4().hex[:4]}",
            "type": "WAREHOUSE",
            "address": "Zona Sur Km 7",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_w.status_code == 201
    assert res_w.json()["type"] == "WAREHOUSE"


def test_update_and_deactivate_location(client: TestClient, admin_token: str):
    """Test updating and deactivating an inventory location."""
    create_res = client.post(
        "/api/v1/inventory/locations",
        json={"name": f"Sucursal Tarija {uuid.uuid4().hex[:4]}", "type": "BRANCH"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    loc_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/inventory/locations/{loc_id}",
        json={"address": "Calle Sucre #100", "phone": "+59146655443"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["address"] == "Calle Sucre #100"

    del_res = client.delete(
        f"/api/v1/inventory/locations/{loc_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_res.status_code == 200
    assert del_res.json()["is_active"] is False


# ====================================================================
# 2. INITIAL STOCK TESTS
# ====================================================================

def test_initial_stock_creates_inventory_item(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test setting initial stock creates InventoryItem and INITIAL movement."""
    f = inventory_fixtures
    res = client.post(
        "/api/v1/inventory/movements/initial",
        json={
            "variant_id": str(f["variant"].id),
            "location_id": str(f["warehouse"].id),
            "quantity": 50,
            "notes": "Apertura de inventario inicial",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["quantity"] == 50
    assert data["reserved_quantity"] == 0
    assert data["available_quantity"] == 50


def test_duplicate_initial_stock_rejected(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test setting initial stock twice for same variant and location returns 409 Conflict."""
    f = inventory_fixtures
    client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": str(f["variant"].id), "location_id": str(f["warehouse"].id), "quantity": 30},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res2 = client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": str(f["variant"].id), "location_id": str(f["warehouse"].id), "quantity": 40},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res2.status_code == 409
    assert "already set" in res2.json()["detail"].lower()


# ====================================================================
# 3. PURCHASES & SALES TESTS
# ====================================================================

def test_purchase_increases_stock(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test supplier purchase increases stock and records movement."""
    f = inventory_fixtures
    res = client.post(
        "/api/v1/inventory/movements/purchase",
        json={
            "variant_id": str(f["variant"].id),
            "to_location_id": str(f["warehouse"].id),
            "quantity": 25,
            "reference": "OC-2026-001",
            "notes": "Compra proveedor Textiles Andinos",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["quantity"] == 25


def test_sale_decreases_stock(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test retail sale decreases available stock."""
    f = inventory_fixtures
    client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": str(f["variant"].id), "to_location_id": str(f["branch_sc"].id), "quantity": 10},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    sale_res = client.post(
        "/api/v1/inventory/movements/sale",
        json={
            "variant_id": str(f["variant"].id),
            "from_location_id": str(f["branch_sc"].id),
            "quantity": 3,
            "reference": "TICKET-1049",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert sale_res.status_code == 201
    assert sale_res.json()["quantity"] == 7
    assert sale_res.json()["available_quantity"] == 7


def test_sale_rejected_when_insufficient_stock(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test sale fails with 400 Bad Request when requested quantity exceeds available stock."""
    f = inventory_fixtures
    client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": str(f["variant"].id), "to_location_id": str(f["branch_sc"].id), "quantity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.post(
        "/api/v1/inventory/movements/sale",
        json={
            "variant_id": str(f["variant"].id),
            "from_location_id": str(f["branch_sc"].id),
            "quantity": 10,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
    assert "insufficient" in res.json()["detail"].lower()


# ====================================================================
# 4. TRANSFER CRITICAL TESTS (PROMPT #22 SPECIFICATION)
# ====================================================================

def test_transfer_stock_critical_scenario(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Critical scenario from prompt #22:
    Stock Almacén = 20, Stock Sucursal = 5
    Transfer 7 units from Almacén -> Sucursal
    Expected Result: Almacén = 13, Sucursal = 12
    """
    f = inventory_fixtures
    warehouse_id = str(f["warehouse"].id)
    branch_id = str(f["branch_sc"].id)
    variant_id = str(f["variant"].id)

    # Set up Almacén = 20
    client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": variant_id, "location_id": warehouse_id, "quantity": 20},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Set up Sucursal = 5
    client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": variant_id, "location_id": branch_id, "quantity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Perform transfer: quantity = 7
    transfer_res = client.post(
        "/api/v1/inventory/movements/transfer",
        json={
            "variant_id": variant_id,
            "from_location_id": warehouse_id,
            "to_location_id": branch_id,
            "quantity": 7,
            "reference": "TRF-SC-001",
            "notes": "Envío de reposición a sucursal",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert transfer_res.status_code == 201
    data = transfer_res.json()
    assert data["source_location"]["new_quantity"] == 13
    assert data["destination_location"]["new_quantity"] == 12

    # Verify directly via stock endpoint
    stock_res = client.get(
        f"/api/v1/inventory/stock/variant/{variant_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert stock_res.status_code == 200
    stock_by_loc = {item["location_id"]: item["quantity"] for item in stock_res.json()}
    assert stock_by_loc[warehouse_id] == 13
    assert stock_by_loc[branch_id] == 12


def test_transfer_rejected_when_insufficient_stock(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test transfer is rejected with 400 when source has insufficient stock."""
    f = inventory_fixtures
    client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": str(f["variant"].id), "location_id": str(f["warehouse"].id), "quantity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.post(
        "/api/v1/inventory/movements/transfer",
        json={
            "variant_id": str(f["variant"].id),
            "from_location_id": str(f["warehouse"].id),
            "to_location_id": str(f["branch_sc"].id),
            "quantity": 10,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
    assert "insufficient" in res.json()["detail"].lower()


def test_transfer_same_location_rejected(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test transferring to the same location returns 400."""
    f = inventory_fixtures
    res = client.post(
        "/api/v1/inventory/movements/transfer",
        json={
            "variant_id": str(f["variant"].id),
            "from_location_id": str(f["warehouse"].id),
            "to_location_id": str(f["warehouse"].id),
            "quantity": 5,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
    assert "cannot be the same" in res.json()["detail"].lower()


# ====================================================================
# 5. ADJUSTMENTS & RETURNS TESTS
# ====================================================================

def test_positive_and_negative_adjustments(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test audit adjustments with mandatory notes."""
    f = inventory_fixtures
    variant_id = str(f["variant"].id)
    loc_id = str(f["warehouse"].id)

    # Initial stock: 10
    client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": variant_id, "location_id": loc_id, "quantity": 10},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Positive adjustment (+5) -> 15
    adj_pos = client.post(
        "/api/v1/inventory/movements/adjustment",
        json={"variant_id": variant_id, "location_id": loc_id, "quantity_delta": 5, "is_positive": True, "notes": "Auditoría física sobrante"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert adj_pos.status_code == 201
    assert adj_pos.json()["quantity"] == 15

    # Negative adjustment (-4) -> 11
    adj_neg = client.post(
        "/api/v1/inventory/movements/adjustment",
        json={"variant_id": variant_id, "location_id": loc_id, "quantity_delta": 4, "is_positive": False, "notes": "Merma por prenda manchada"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert adj_neg.status_code == 201
    assert adj_neg.json()["quantity"] == 11


def test_negative_adjustment_exceeding_stock_rejected(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test negative adjustment cannot reduce stock below zero."""
    f = inventory_fixtures
    variant_id = str(f["variant"].id)
    loc_id = str(f["warehouse"].id)

    client.post(
        "/api/v1/inventory/movements/initial",
        json={"variant_id": variant_id, "location_id": loc_id, "quantity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.post(
        "/api/v1/inventory/movements/adjustment",
        json={"variant_id": variant_id, "location_id": loc_id, "quantity_delta": 10, "is_positive": False, "notes": "Ajuste excesivo"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
    assert "below zero" in res.json()["detail"].lower()


def test_customer_return(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test customer product return increments stock."""
    f = inventory_fixtures
    variant_id = str(f["variant"].id)
    branch_id = str(f["branch_sc"].id)

    res = client.post(
        "/api/v1/inventory/movements/return",
        json={"variant_id": variant_id, "to_location_id": branch_id, "quantity": 2, "reference": "RET-2026-88", "notes": "Devolución por cambio de talla"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["quantity"] == 2


# ====================================================================
# 6. PUBLIC AVAILABILITY & PRODUCT MATRIX TESTS
# ====================================================================

def test_public_availability_endpoint(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test public availability endpoint returns safe public data (no notes, no users)."""
    f = inventory_fixtures
    variant_id = str(f["variant"].id)

    client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": variant_id, "to_location_id": str(f["branch_sc"].id), "quantity": 8},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": variant_id, "to_location_id": str(f["branch_lp"].id), "quantity": 3},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.get(f"/api/v1/inventory/public/availability/{variant_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["variant_id"] == variant_id
    assert data["total_available"] == 11
    assert len(data["locations"]) == 2
    assert "user" not in data
    assert "notes" not in data


def test_public_product_availability(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test querying availability for all variants of a product."""
    f = inventory_fixtures
    product_id = str(f["product"].id)

    res = client.get(f"/api/v1/inventory/public/product-availability/{product_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["product_id"] == product_id
    assert len(data["variants"]) == 1


# ====================================================================
# 7. SECURITY & RBAC TESTS
# ====================================================================

def test_customer_cannot_create_movement(client: TestClient, customer_token: str, inventory_fixtures: dict):
    """Test CUSTOMER gets 403 Forbidden when attempting to record movements."""
    f = inventory_fixtures
    res = client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": str(f["variant"].id), "to_location_id": str(f["branch_sc"].id), "quantity": 10},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 403


def test_branch_manager_can_create_movement(client: TestClient, branch_manager_token: str, inventory_fixtures: dict):
    """Test BRANCH_MANAGER can record purchases and sales."""
    f = inventory_fixtures
    res = client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": str(f["variant"].id), "to_location_id": str(f["branch_sc"].id), "quantity": 15},
        headers={"Authorization": f"Bearer {branch_manager_token}"},
    )
    assert res.status_code == 201


def test_unauthenticated_cannot_create_movement(client: TestClient, inventory_fixtures: dict):
    """Test request without token returns 401 Unauthorized."""
    f = inventory_fixtures
    res = client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": str(f["variant"].id), "to_location_id": str(f["branch_sc"].id), "quantity": 10},
    )
    assert res.status_code == 401


# ====================================================================
# 8. AUDIT MOVEMENTS LEDGER & FILTERS TESTS
# ====================================================================

def test_list_movements_with_filters_and_pagination(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test audit ledger listing with filters by type, variant, and pagination."""
    f = inventory_fixtures
    variant_id = str(f["variant"].id)
    wh_id = str(f["warehouse"].id)

    # 1. Purchase
    client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": variant_id, "to_location_id": wh_id, "quantity": 50, "reference": "REF-PURCH-1"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    # 2. Sale
    client.post(
        "/api/v1/inventory/movements/sale",
        json={"variant_id": variant_id, "from_location_id": wh_id, "quantity": 5, "reference": "REF-SALE-1"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # List all movements for this variant
    res = client.get(
        f"/api/v1/inventory/movements?variant_id={variant_id}&page=1&limit=10",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2
    assert "items" in data

    # Filter specifically by SALE movement_type
    res_filtered = client.get(
        f"/api/v1/inventory/movements?variant_id={variant_id}&movement_type=SALE",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_filtered.status_code == 200
    for mov in res_filtered.json()["items"]:
        assert mov["movement_type"] == "SALE"


def test_get_stock_by_location_endpoint(client: TestClient, admin_token: str, inventory_fixtures: dict):
    """Test querying all inventory items for a specific location."""
    f = inventory_fixtures
    wh_id = str(f["warehouse"].id)

    client.post(
        "/api/v1/inventory/movements/purchase",
        json={"variant_id": str(f["variant"].id), "to_location_id": wh_id, "quantity": 30},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.get(
        f"/api/v1/inventory/stock/location/{wh_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    assert items[0]["location_id"] == wh_id
