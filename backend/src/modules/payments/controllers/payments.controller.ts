import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service.js';
import {
  CreatePaymentIntentDto,
  CreateQrPaymentDto,
  ConfirmPaymentDto,
} from '../dto/payments.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/v1/payments/create-payment-intent
   * Crea un PaymentIntent de Stripe y devuelve el clientSecret
   * para que el frontend lo use con Stripe.js Elements (in-app, sin redirección).
   */
  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @Request() req: any,
  ) {
    void req; // el usuario ya está autenticado vía JWT
    return this.paymentsService.createPaymentIntent(dto);
  }

  /**
   * POST /api/v1/payments/create-qr
   * Genera datos para el QR de pago interoperable con apps bancarias.
   * El cliente renderiza el QR con los datos devueltos.
   */
  @Post('create-qr')
  async createQrPayment(@Body() dto: CreateQrPaymentDto) {
    return this.paymentsService.createQrPayment(dto);
  }

  /**
   * POST /api/v1/payments/confirm-stripe
   * Verifica en Stripe que el PaymentIntent fue completado exitosamente
   * y actualiza la orden en base de datos.
   */
  @Post('confirm-stripe')
  async confirmStripe(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmStripePayment(
      dto.paymentIntentId,
      dto.orderId,
    );
  }

  /**
   * POST /api/v1/payments/confirm-qr
   * El cliente confirma que el QR fue escaneado y pagado.
   * Actualiza la orden en base de datos.
   */
  @Post('confirm-qr')
  async confirmQr(
    @Body() body: { transactionRef: string; orderId: string },
  ) {
    return this.paymentsService.confirmQrPayment(
      body.transactionRef,
      body.orderId,
    );
  }
}
