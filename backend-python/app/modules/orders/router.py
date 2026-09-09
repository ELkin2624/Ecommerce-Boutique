import uuid
from typing import List
from fastapi import APIRouter, Depends, status

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db, require_role
from app.modules.auth.models import User
from app.modules.catalog.service import CatalogService
from app.modules.catalog.repository import CatalogRepository
from app.modules.inventory.service import InventoryService
from app.modules.inventory.repository import InventoryRepository
from app.modules.orders.models import OrderStatus, PaymentStatus
from app.modules.orders.repository import CartRepository, OrderRepository
from app.modules.orders.schemas import (
    CartResponse,
    CartItemCreate,
    CartItemResponse,
    CheckoutRequest,
    OrderResponse,
)
from app.modules.orders.service import CartService, OrderService
from app.modules.orders.payment import SimulatedPaymentProcessor

router = APIRouter(prefix=f"{settings.API_V1_STR}/orders", tags=["Orders"])
cart_router = APIRouter(prefix=f"{settings.API_V1_STR}/cart", tags=["Cart"])


def get_cart_service(db=Depends(get_db)):
    catalog_repo = CatalogRepository(db)
    catalog_service = CatalogService(catalog_repo)
    cart_repo = CartRepository(db)
    return CartService(cart_repo, catalog_service)


def get_order_service(db=Depends(get_db)):
    order_repo = OrderRepository(db)
    cart_repo = CartRepository(db)
    inventory_repo = InventoryRepository(db)
    inventory_service = InventoryService(inventory_repo)
    catalog_repo = CatalogRepository(db)
    catalog_service = CatalogService(catalog_repo)
    payment_processor = SimulatedPaymentProcessor()
    
    return OrderService(
        order_repo=order_repo,
        cart_repo=cart_repo,
        inventory_service=inventory_service,
        catalog_service=catalog_service,
        payment_processor=payment_processor,
    )


# ==========================================
# Cart Endpoints
# ==========================================
@cart_router.get("", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    cart = service.get_or_create_cart(current_user.id)
    
    # Calculate live totals for the response
    items = []
    total = 0
    for item in cart.items:
        variant = service.catalog_service.get_variant(item.product_variant_id)
        sub = variant.price * item.quantity
        total += sub
        items.append({
            "id": item.id,
            "product_variant_id": item.product_variant_id,
            "quantity": item.quantity,
            "cart_id": cart.id,
            "unit_price": variant.price,
            "subtotal": sub,
        })
        
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "created_at": cart.created_at,
        "updated_at": cart.updated_at,
        "items": items,
        "total_amount": total,
    }

@cart_router.post("/items", response_model=CartItemResponse)
def add_to_cart(
    data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    item = service.add_item(current_user.id, data.product_variant_id, data.quantity)
    variant = service.catalog_service.get_variant(item.product_variant_id)
    return {
        "id": item.id,
        "product_variant_id": item.product_variant_id,
        "quantity": item.quantity,
        "cart_id": item.cart_id,
        "unit_price": variant.price,
        "subtotal": variant.price * item.quantity,
    }

@cart_router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    service.remove_item(current_user.id, item_id)


# ==========================================
# Orders Endpoints
# ==========================================
@router.post("/checkout", response_model=OrderResponse)
def checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.checkout(current_user.id, request)

@router.get("", response_model=List[OrderResponse])
def list_orders(
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.order_repo.list_user_orders(current_user.id)

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.get_order(order_id, current_user.id)

@router.post("/{order_id}/pay", response_model=OrderResponse)
def pay_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    # Validates ownership inside
    order = service.get_order(order_id, current_user.id)
    return service.process_payment(order.id, current_user.id)

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    order = service.get_order(order_id, current_user.id)
    return service.cancel_order(order.id, current_user.id)


# Admin endpoint for releasing expired orders
admin_order_router = APIRouter(prefix=f"{settings.API_V1_STR}/admin/orders", tags=["Admin Orders"])

@admin_order_router.post("/release-expired")
def release_expired_reservations(
    current_user: User = Depends(require_role("ADMIN")),
    service: OrderService = Depends(get_order_service),
):
    released_count = service.release_expired_reservations()
    return {"message": f"Successfully released {released_count} expired orders"}
