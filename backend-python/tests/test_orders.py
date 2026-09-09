import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi.testclient import TestClient

from app.modules.auth.models import User, Role
from app.core.security import hash_password
from app.modules.catalog.models import Product, ProductVariant
from app.modules.inventory.models import InventoryLocation, LocationType, InventoryItem, MovementType, InventoryMovement
from app.modules.orders.models import Order, OrderStatus, PaymentStatus, OrderStatusHistory
from app.modules.orders.schemas import CheckoutRequest

@pytest.fixture
def setup_orders_data(db_session: Session):
    # Get CUSTOMER role
    customer_role = db_session.scalars(select(Role).where(Role.name == "CUSTOMER")).first()
    
    # Create User
    user = User(
        email="customer_orders@example.com",
        password_hash=hash_password("password"),
        first_name="Test",
        last_name="Customer",
        role_id=customer_role.id
    )
    db_session.add(user)
    
    # Get locations from seed
    warehouse = db_session.scalars(select(InventoryLocation).where(InventoryLocation.type == LocationType.WAREHOUSE)).first()
    branch = db_session.scalars(select(InventoryLocation).where(InventoryLocation.type == LocationType.BRANCH)).first()
    
    # Get category, color, size
    from app.modules.catalog.models import Category, Color, Size
    category = db_session.scalars(select(Category)).first()
    color = db_session.scalars(select(Color)).first()
    sizes = db_session.scalars(select(Size).limit(2)).all()
    size1 = sizes[0]
    size2 = sizes[1]
    
    # Create a product and two variants
    product = Product(
        name="Test Shirt",
        description="A nice shirt",
        category_id=category.id,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    variant1 = ProductVariant(
        product_id=product.id,
        sku=f"TSHIRT-01-{uuid.uuid4().hex[:4]}",
        price=Decimal("100.00"),
        color_id=color.id,
        size_id=size1.id,
    )
    variant2 = ProductVariant(
        product_id=product.id,
        sku=f"TSHIRT-02-{uuid.uuid4().hex[:4]}",
        price=Decimal("150.00"),
        color_id=color.id,
        size_id=size2.id,
    )
    db_session.add_all([variant1, variant2])
    db_session.commit()
    db_session.refresh(variant1)
    db_session.refresh(variant2)
    
    # Initialize stock
    # Variant 1: 10 in warehouse, 5 in branch
    item1_wh = InventoryItem(variant_id=variant1.id, location_id=warehouse.id, quantity=10, reserved_quantity=0)
    item1_br = InventoryItem(variant_id=variant1.id, location_id=branch.id, quantity=5, reserved_quantity=0)
    
    # Variant 2: 2 in warehouse, 0 in branch
    item2_wh = InventoryItem(variant_id=variant2.id, location_id=warehouse.id, quantity=2, reserved_quantity=0)
    
    db_session.add_all([item1_wh, item1_br, item2_wh])
    db_session.commit()
    db_session.refresh(item1_wh)
    db_session.refresh(item1_br)
    db_session.refresh(item2_wh)
    
    return {
        "user": user,
        "warehouse": warehouse,
        "branch": branch,
        "variant1": variant1,
        "variant2": variant2,
        "item1_wh": item1_wh,
        "item1_br": item1_br,
        "item2_wh": item2_wh,
    }

@pytest.fixture
def auth_headers(client: TestClient, setup_orders_data):
    user = setup_orders_data["user"]
    response = client.post("/api/v1/auth/login", json={"email": user.email, "password": "password"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_checkout_uses_warehouse_for_shipping(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    
    # Add to cart
    res = client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 3}, headers=auth_headers)
    assert res.status_code == 200
    
    # Check inventory before
    db_session.refresh(setup_orders_data["item1_wh"])
    assert setup_orders_data["item1_wh"].quantity == 10
    assert setup_orders_data["item1_wh"].reserved_quantity == 0
    
    # Checkout
    res = client.post("/api/v1/orders/checkout", json={
        "payment_method": "CREDIT_CARD",
        "shipping_address": "123 Main St"
    }, headers=auth_headers)
    assert res.status_code == 200
    order_data = res.json()
    assert order_data["pickup_location_id"] is None
    
    # Verify stock reserved in warehouse
    db_session.refresh(setup_orders_data["item1_wh"])
    assert setup_orders_data["item1_wh"].quantity == 10
    assert setup_orders_data["item1_wh"].reserved_quantity == 3
    assert setup_orders_data["item1_wh"].available_quantity == 7


def test_checkout_uses_pickup_location(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    branch_id = str(setup_orders_data["branch"].id)
    
    # Clear cart and add item
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 2}, headers=auth_headers)
    
    # Checkout with pickup
    res = client.post("/api/v1/orders/checkout", json={
        "payment_method": "CASH",
        "pickup_location_id": branch_id
    }, headers=auth_headers)
    assert res.status_code == 200
    
    db_session.refresh(setup_orders_data["item1_br"])
    assert setup_orders_data["item1_br"].reserved_quantity == 2


def test_checkout_rejects_split_fulfillment(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v2_id = str(setup_orders_data["variant2"].id)
    
    # Clear cart first (if needed, but each test isolated mostly, wait client keeps session? No, tests are isolated if we clear cart or use new user. Wait, DB session is isolated per test!)
    # Actually db_session isolation is good, but cart might persist if tests share same user. Let's just use the same user since tests rollback!
    client.post("/api/v1/cart/items", json={"product_variant_id": v2_id, "quantity": 3}, headers=auth_headers)
    
    # V2 has only 2 in warehouse, 0 in branch. Requesting 3 should fail.
    res = client.post("/api/v1/orders/checkout", json={
        "payment_method": "CREDIT_CARD",
        "shipping_address": "123 Main St"
    }, headers=auth_headers)
    
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()["detail"]


def test_checkout_rolls_back_all_reservations_when_one_item_fails(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    v2_id = str(setup_orders_data["variant2"].id)
    item1_wh_id = setup_orders_data["item1_wh"].id
    
    # Add v1 (has stock) and v2 (requires 10, has only 2)
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 2}, headers=auth_headers)
    client.post("/api/v1/cart/items", json={"product_variant_id": v2_id, "quantity": 10}, headers=auth_headers)
    
    # Checkout should fail because v2 doesn't have stock
    res = client.post("/api/v1/orders/checkout", json={
        "payment_method": "CREDIT_CARD"
    }, headers=auth_headers)
    
    assert res.status_code == 400
    
    # Verify v1 reservation was rolled back
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == item1_wh_id)).first()
    assert wh_item.reserved_quantity == 0


def test_successful_payment_consumes_reserved_stock(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 2}, headers=auth_headers)
    
    res = client.post("/api/v1/orders/checkout", json={"payment_method": "CREDIT_CARD"}, headers=auth_headers)
    order_id = res.json()["id"]
    
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.reserved_quantity == 2
    
    # Pay
    res = client.post(f"/api/v1/orders/{order_id}/pay", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["payment_status"] == "PAID"
    assert res.json()["status"] == "CONFIRMED"
    
    # Check stock
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.quantity == 8
    assert wh_item.reserved_quantity == 0


def test_successful_payment_creates_sale_movement(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 1}, headers=auth_headers)
    
    res = client.post("/api/v1/orders/checkout", json={"payment_method": "CREDIT_CARD"}, headers=auth_headers)
    order_id = res.json()["id"]
    order_num = res.json()["order_number"]
    
    client.post(f"/api/v1/orders/{order_id}/pay", headers=auth_headers)
    
    # Verify movement
    stmt = select(InventoryMovement).where(InventoryMovement.reference == f"ORDER-{order_num}")
    movement = db_session.scalars(stmt).first()
    
    assert movement is not None
    assert movement.movement_type == MovementType.SALE
    assert movement.quantity == 1


def test_payment_failure_preserves_reserved_stock(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 2}, headers=auth_headers)
    
    res = client.post("/api/v1/orders/checkout", json={"payment_method": "FAIL_ME"}, headers=auth_headers)
    order_id = res.json()["id"]
    
    res = client.post(f"/api/v1/orders/{order_id}/pay", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["payment_status"] == "FAILED"
    assert res.json()["status"] == "PENDING"
    
    # Check stock is still reserved, quantity not decremented
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.quantity == 10
    assert wh_item.reserved_quantity == 2


def test_cancel_order_releases_reservation_only_once(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 4}, headers=auth_headers)
    
    res = client.post("/api/v1/orders/checkout", json={"payment_method": "CREDIT_CARD"}, headers=auth_headers)
    order_id = res.json()["id"]
    
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.reserved_quantity == 4
    
    # Cancel 1st time
    res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=auth_headers)
    assert res.status_code == 200
    
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.reserved_quantity == 0
    
    # Cancel 2nd time should fail because it's not PENDING
    res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=auth_headers)
    assert res.status_code == 400
    
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.reserved_quantity == 0


def test_expired_order_releases_reservation_only_once(client: TestClient, setup_orders_data, auth_headers, db_session: Session):
    v1_id = str(setup_orders_data["variant1"].id)
    client.post("/api/v1/cart/items", json={"product_variant_id": v1_id, "quantity": 1}, headers=auth_headers)
    
    res = client.post("/api/v1/orders/checkout", json={"payment_method": "CREDIT_CARD"}, headers=auth_headers)
    order_id = res.json()["id"]
    
    # Manually expire it in DB
    stmt = select(Order).where(Order.id == order_id)
    order = db_session.scalars(stmt).first()
    order.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()
    
    # Create ADMIN user
    admin_role = db_session.scalars(select(Role).where(Role.name == "ADMIN")).first()
    admin_user = User(
        email="admin_orders@example.com",
        password_hash=hash_password("adminpass"),
        first_name="Admin",
        last_name="User",
        role_id=admin_role.id
    )
    db_session.add(admin_user)
    db_session.commit()
    
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(admin_user.id), "role": "ADMIN"})
    admin_headers = {"Authorization": f"Bearer {token}"}
    
    res = client.post("/api/v1/admin/orders/release-expired", headers=admin_headers)
    assert res.status_code == 200
    assert "1 expired orders" in res.json()["message"]
    
    wh_item = db_session.scalars(select(InventoryItem).where(InventoryItem.id == setup_orders_data["item1_wh"].id)).first()
    assert wh_item.reserved_quantity == 0
    
    # Run again, should be 0
    res = client.post("/api/v1/admin/orders/release-expired", headers=admin_headers)
    assert res.status_code == 200
    assert "0 expired orders" in res.json()["message"]
