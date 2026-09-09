import abc
import uuid
from decimal import Decimal
from typing import Tuple


class PaymentProcessor(abc.ABC):
    @abc.abstractmethod
    def process_payment(self, order_id: uuid.UUID, amount: Decimal, method: str) -> Tuple[bool, str]:
        """
        Process the payment for an order.
        Returns a tuple: (success: bool, payment_reference: str)
        """
        pass


class SimulatedPaymentProcessor(PaymentProcessor):
    def process_payment(self, order_id: uuid.UUID, amount: Decimal, method: str) -> Tuple[bool, str]:
        """
        Simulates payment processing.
        Fails if method is 'FAIL_ME'. Otherwise succeeds with a mock transaction ID.
        """
        if method.strip().upper() == "FAIL_ME":
            return False, ""
        
        transaction_id = f"TXN-SIM-{uuid.uuid4().hex[:8].upper()}"
        return True, transaction_id
