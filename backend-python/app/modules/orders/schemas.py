import uuid
from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field, constr

from app.modules.orders.models import OrderStatus, PaymentStatus


# ==========================================
# Cart Schemas
# ==========================================
class CartItemBase(BaseModel):
    product_variant_id: uuid.UUID
    quantity: int = Field(gt=0)


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemResponse(CartItemBase):
    id: uuid.UUID
    cart_id: uuid.UUID
    unit_price: Decimal  # Calculated on the fly from variant
    subtotal: Decimal    # Calculated on the fly

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    items: List[CartItemResponse]
    total_amount: Decimal  # Calculated on the fly
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Checkout & Order Schemas
# ==========================================
class CheckoutRequest(BaseModel):
    payment_method: str = Field(..., min_length=2, max_length=50)
    shipping_address: Optional[str] = None
    billing_address: Optional[str] = None
    pickup_location_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    product_variant_id: uuid.UUID
    inventory_item_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    
    class Config:
        from_attributes = True


class OrderStatusHistoryResponse(BaseModel):
    id: uuid.UUID
    status: OrderStatus
    notes: Optional[str]
    created_by_user_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    order_number: str
    status: OrderStatus
    payment_method: str
    payment_status: PaymentStatus
    payment_reference: Optional[str]
    
    subtotal: Decimal
    tax: Decimal
    shipping_cost: Decimal
    total: Decimal
    
    shipping_address: Optional[str]
    billing_address: Optional[str]
    pickup_location_id: Optional[uuid.UUID]
    notes: Optional[str]
    
    expires_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    items: List[OrderItemResponse]
    history: List[OrderStatusHistoryResponse]

    class Config:
        from_attributes = True
