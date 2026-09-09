import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.orders.models import Cart, CartItem, Order, OrderItem, OrderStatusHistory


class CartRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_cart_by_user_id(self, user_id: uuid.UUID) -> Optional[Cart]:
        stmt = select(Cart).where(Cart.user_id == user_id)
        return self.db.scalars(stmt).first()

    def create_cart(self, user_id: uuid.UUID) -> Cart:
        cart = Cart(user_id=user_id)
        self.db.add(cart)
        self.db.commit()
        self.db.refresh(cart)
        return cart

    def get_cart_item(self, cart_id: uuid.UUID, variant_id: uuid.UUID) -> Optional[CartItem]:
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_variant_id == variant_id
        )
        return self.db.scalars(stmt).first()

    def get_cart_item_by_id(self, item_id: uuid.UUID) -> Optional[CartItem]:
        stmt = select(CartItem).where(CartItem.id == item_id)
        return self.db.scalars(stmt).first()

    def add_item_to_cart(self, cart_id: uuid.UUID, variant_id: uuid.UUID, quantity: int) -> CartItem:
        item = CartItem(cart_id=cart_id, product_variant_id=variant_id, quantity=quantity)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update_item_quantity(self, item: CartItem, quantity: int) -> CartItem:
        item.quantity = quantity
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_item(self, item: CartItem):
        self.db.delete(item)
        self.db.commit()

    def clear_cart(self, cart_id: uuid.UUID):
        # Done as part of a transaction, so no self.db.commit() here
        stmt = select(CartItem).where(CartItem.cart_id == cart_id)
        items = self.db.scalars(stmt).all()
        for item in items:
            self.db.delete(item)


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_order_by_id(self, order_id: uuid.UUID) -> Optional[Order]:
        stmt = select(Order).where(Order.id == order_id)
        return self.db.scalars(stmt).first()

    def list_user_orders(self, user_id: uuid.UUID) -> List[Order]:
        stmt = select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def list_all_orders(self) -> List[Order]:
        stmt = select(Order).order_by(Order.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def create_order_with_items_and_history(
        self,
        order: Order,
        items: List[OrderItem],
        history: OrderStatusHistory
    ) -> Order:
        # All added to the session. No commit, caller will commit!
        self.db.add(order)
        for item in items:
            self.db.add(item)
        self.db.add(history)
        # Flush to get the order.id assigned to items and history (already bound by SQLAlchemy relationships, but safe)
        self.db.flush()
        return order

    def add_history(self, history: OrderStatusHistory):
        self.db.add(history)
        self.db.flush()
