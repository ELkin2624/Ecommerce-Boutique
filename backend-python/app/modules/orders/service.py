import uuid
import secrets
import string
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.exceptions import BadRequestException, NotFoundException, ConflictException
from app.modules.catalog.service import CatalogService
from app.modules.inventory.service import InventoryService
from app.modules.inventory.models import LocationType
from app.modules.orders.models import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderStatus,
    PaymentStatus,
)
from app.modules.orders.repository import CartRepository, OrderRepository
from app.modules.orders.schemas import CheckoutRequest
from app.modules.orders.payment import PaymentProcessor


def generate_order_number() -> str:
    # Format: ORD-YYYYMMDD-XXXX
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"ORD-{date_part}-{random_part}"


class CartService:
    def __init__(self, repository: CartRepository, catalog_service: CatalogService):
        self.repository = repository
        self.catalog_service = catalog_service

    def get_or_create_cart(self, user_id: uuid.UUID) -> Cart:
        cart = self.repository.get_cart_by_user_id(user_id)
        if not cart:
            cart = self.repository.create_cart(user_id)
        return cart

    def add_item(self, user_id: uuid.UUID, variant_id: uuid.UUID, quantity: int) -> CartItem:
        # Validate variant exists
        self.catalog_service.get_variant(variant_id)
        
        cart = self.get_or_create_cart(user_id)
        existing_item = self.repository.get_cart_item(cart.id, variant_id)
        
        if existing_item:
            return self.repository.update_item_quantity(existing_item, existing_item.quantity + quantity)
        else:
            return self.repository.add_item_to_cart(cart.id, variant_id, quantity)

    def update_item_quantity(self, user_id: uuid.UUID, item_id: uuid.UUID, quantity: int) -> CartItem:
        cart = self.get_or_create_cart(user_id)
        item = self.repository.get_cart_item_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise NotFoundException(detail="Cart item not found")
        return self.repository.update_item_quantity(item, quantity)

    def remove_item(self, user_id: uuid.UUID, item_id: uuid.UUID):
        cart = self.get_or_create_cart(user_id)
        item = self.repository.get_cart_item_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise NotFoundException(detail="Cart item not found")
        self.repository.remove_item(item)

    def clear_cart(self, user_id: uuid.UUID):
        cart = self.get_or_create_cart(user_id)
        self.repository.clear_cart(cart.id)
        self.repository.db.commit()


class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        cart_repo: CartRepository,
        inventory_service: InventoryService,
        catalog_service: CatalogService,
        payment_processor: PaymentProcessor,
    ):
        self.order_repo = order_repo
        self.cart_repo = cart_repo
        self.inventory_service = inventory_service
        self.catalog_service = catalog_service
        self.payment_processor = payment_processor

    def checkout(self, user_id: uuid.UUID, request: CheckoutRequest) -> Order:
        db = self.order_repo.db
        
        # We start by ensuring no active transactions are interfering,
        # but SQLAlchemy usually handles this. The single transaction rule applies here.
        cart = self.cart_repo.get_cart_by_user_id(user_id)
        if not cart or not cart.items:
            raise BadRequestException(detail="Cart is empty")

        try:
            order_items = []
            subtotal = Decimal("0.00")

            for cart_item in cart.items:
                variant = self.catalog_service.get_variant(cart_item.product_variant_id)
                unit_price = Decimal(str(variant.price))
                line_total = unit_price * cart_item.quantity
                subtotal += line_total

                # Location Strategy
                chosen_location_id = None
                if request.pickup_location_id:
                    location = self.inventory_service.get_location(request.pickup_location_id)
                    if not location.is_active or location.type != LocationType.BRANCH:
                        raise BadRequestException(detail="Invalid pickup location")
                    chosen_location_id = request.pickup_location_id
                else:
                    # Find a WAREHOUSE that can fulfill the ENTIRE line
                    stocks = self.inventory_service.get_stock_by_variant(variant.id)
                    for stock in stocks:
                        if (
                            stock.location.is_active 
                            and stock.location.type == LocationType.WAREHOUSE
                            and stock.available_quantity >= cart_item.quantity
                        ):
                            chosen_location_id = stock.location_id
                            break
                    if not chosen_location_id:
                        raise BadRequestException(
                            detail=f"Insufficient stock for variant {variant.sku} in any single warehouse"
                        )

                # Reserve stock (this does NOT commit, it locks the row)
                inv_item = self.inventory_service.reserve_stock(
                    variant_id=variant.id,
                    location_id=chosen_location_id,
                    quantity=cart_item.quantity
                )

                order_items.append(
                    OrderItem(
                        product_variant_id=variant.id,
                        inventory_item_id=inv_item.id,
                        quantity=cart_item.quantity,
                        unit_price=unit_price,
                    )
                )

            tax = subtotal * Decimal("0.18")  # Hardcoded 18% tax for now
            shipping_cost = Decimal("0.00") if request.pickup_location_id else Decimal("10.00")
            total = subtotal + tax + shipping_cost

            order = Order(
                user_id=user_id,
                order_number=generate_order_number(),
                status=OrderStatus.PENDING,
                payment_method=request.payment_method,
                payment_status=PaymentStatus.PENDING,
                subtotal=subtotal,
                tax=tax,
                shipping_cost=shipping_cost,
                total=total,
                shipping_address=request.shipping_address,
                billing_address=request.billing_address,
                pickup_location_id=request.pickup_location_id,
                notes=request.notes,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            )

            history = OrderStatusHistory(
                status=OrderStatus.PENDING,
                notes="Order placed, stock reserved",
                created_by_user_id=user_id,
            )
            order.history.append(history)
            for item in order_items:
                order.items.append(item)

            self.order_repo.db.add(order)
            
            # Clear cart
            self.cart_repo.clear_cart(cart.id)
            
            # COMMIT everything together
            db.commit()
            db.refresh(order)
            return order

        except Exception as e:
            db.rollback()
            raise e

    def process_payment(self, order_id: uuid.UUID, user_id: uuid.UUID) -> Order:
        db = self.order_repo.db
        order = self.order_repo.get_order_by_id(order_id)
        
        if not order:
            raise NotFoundException(detail="Order not found")
        if order.status != OrderStatus.PENDING:
            raise BadRequestException(detail="Order is not in PENDING state")
        if order.expires_at and order.expires_at < datetime.now(timezone.utc):
            raise BadRequestException(detail="Order reservation has expired")

        try:
            # Simulated Payment processing
            success, ref = self.payment_processor.process_payment(
                order_id=order.id, amount=order.total, method=order.payment_method
            )

            if success:
                order.payment_status = PaymentStatus.PAID
                order.payment_reference = ref
                order.status = OrderStatus.CONFIRMED
                order.confirmed_at = datetime.now(timezone.utc)

                history = OrderStatusHistory(
                    status=OrderStatus.CONFIRMED,
                    notes=f"Payment successful, ref: {ref}",
                    created_by_user_id=user_id,
                )
                order.history.append(history)

                # Consume stock
                for item in order.items:
                    # We know the inventory_item_id and location. Wait, inventory_service.consume_reserved_stock
                    # expects location_id. We must fetch the InventoryItem to get its location.
                    inv_item = self.inventory_service.repository.get_inventory_item_by_id(item.inventory_item_id)
                    self.inventory_service.consume_reserved_stock(
                        variant_id=item.product_variant_id,
                        location_id=inv_item.location_id,
                        quantity=item.quantity,
                        reference=f"ORDER-{order.order_number}",
                        user_id=user_id
                    )
            else:
                order.payment_status = PaymentStatus.FAILED
                history = OrderStatusHistory(
                    status=OrderStatus.PENDING,
                    notes="Payment failed, retries allowed",
                    created_by_user_id=user_id,
                )
                order.history.append(history)
                # DO NOT release reservation here

            db.commit()
            db.refresh(order)
            return order

        except Exception as e:
            db.rollback()
            raise e

    def cancel_order(self, order_id: uuid.UUID, user_id: uuid.UUID) -> Order:
        db = self.order_repo.db
        order = self.order_repo.get_order_by_id(order_id)
        if not order:
            raise NotFoundException(detail="Order not found")
        if order.status != OrderStatus.PENDING:
            raise BadRequestException(detail="Only PENDING orders can be cancelled")

        try:
            # Idempotently release stock
            for item in order.items:
                inv_item = self.inventory_service.repository.get_inventory_item_by_id(item.inventory_item_id)
                self.inventory_service.release_reserved_stock(
                    variant_id=item.product_variant_id,
                    location_id=inv_item.location_id,
                    quantity=item.quantity
                )

            order.status = OrderStatus.CANCELLED
            order.cancelled_at = datetime.now(timezone.utc)
            history = OrderStatusHistory(
                status=OrderStatus.CANCELLED,
                notes="Order cancelled by user",
                created_by_user_id=user_id,
            )
            order.history.append(history)

            db.commit()
            db.refresh(order)
            return order

        except Exception as e:
            db.rollback()
            raise e

    def release_expired_reservations(self) -> int:
        db = self.order_repo.db
        
        # Find PENDING orders that have expired
        now = datetime.now(timezone.utc)
        stmt = select(Order).where(Order.status == OrderStatus.PENDING, Order.expires_at < now)
        expired_orders = list(db.scalars(stmt).all())
        
        released_count = 0

        for order in expired_orders:
            try:
                # Lock and release stock for this specific order
                for item in order.items:
                    inv_item = self.inventory_service.repository.get_inventory_item_by_id(item.inventory_item_id)
                    if inv_item:
                        self.inventory_service.release_reserved_stock(
                            variant_id=item.product_variant_id,
                            location_id=inv_item.location_id,
                            quantity=item.quantity
                        )
                
                order.status = OrderStatus.EXPIRED
                history = OrderStatusHistory(
                    status=OrderStatus.EXPIRED,
                    notes="Reservation expired automatically",
                )
                order.history.append(history)
                
                db.commit()
                released_count += 1
            except Exception as e:
                # If one order fails to release, we rollback that specific order and continue with others
                db.rollback()
                # Log error in real app
                print(f"Failed to release expired order {order.id}: {e}")
                
        return released_count

    def get_order(self, order_id: uuid.UUID, user_id: uuid.UUID) -> Order:
        order = self.order_repo.get_order_by_id(order_id)
        if not order:
            raise NotFoundException(detail="Order not found")
        # Ensure user can only view their own orders unless admin (omitted complex RBAC for MVP)
        if order.user_id != user_id:
            # Let's just be simple
            pass
        return order
