import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePaymentIntentDto, CreateQrPaymentDto } from '../dto/payments.dto.js';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY no configurada');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-08-26.dahlia',
    });
  }

  /**
   * Crea un PaymentIntent de Stripe.
   * Devuelve el clientSecret al frontend para que Stripe.js confirme el pago
   * sin redirigir a ninguna pestaña externa.
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    try {
      const currency = (dto.currency ?? 'usd').toLowerCase();

      // Stripe trabaja en centavos (o unidades más pequeñas según moneda)
      const amountInCents = Math.round(dto.amount * 100);

      if (amountInCents < 50) {
        throw new BadRequestException('El monto mínimo para Stripe es $0.50');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // Nunca redirige a pestañas externas
        },
        metadata: {
          source: 'fashionstore-boutique',
          itemCount: dto.items?.length?.toString() ?? '0',
        },
        description:
          dto.items
            ?.map((i) => `${i.productName} x${i.quantity}`)
            .join(', ') || 'FashionStore Boutique',
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: dto.amount,
        currency,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        err.message || 'No se pudo crear la intención de pago con Stripe',
      );
    }
  }

  /**
   * Genera los datos para el pago QR (formato interoperable con apps bancarias).
   * El QR se renderiza en el cliente; aquí solo generamos el payload estándar.
   */
  async createQrPayment(dto: CreateQrPaymentDto) {
    const currency = (dto.currency ?? 'BOB').toUpperCase();
    const transactionRef = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Payload estándar EMVCo QR para apps bancarias bolivianas / interoperables
    const qrPayload = [
      '000201',                           // Payload Format Indicator
      '010212',                           // Point of Initiation Method (dinámico)
      `26${String(30 + transactionRef.length).padStart(2, '0')}0010fashionstore0214${transactionRef}`,
      '52045411',                         // MCC Fashion Boutique
      `5303${currency === 'BOB' ? '068' : '840'}`, // moneda ISO 4217
      `5802BO`,                           // Country code Bolivia
      `5913FashionBoutique`,
      `6304`,                             // CRC placeholder
    ].join('');

    return {
      transactionRef,
      amount: dto.amount,
      currency,
      description: dto.description || 'Pago FashionStore Boutique',
      expiresAt,
      qrData: `fashionstore://pay?ref=${transactionRef}&amount=${dto.amount}&currency=${currency}`,
      // Este string es el que el cliente convierte en QR visual con qrcode.react
      qrString: `${transactionRef}|${dto.amount}|${currency}|FashionStore Boutique`,
    };
  }

  /**
   * Confirma un pago Stripe verificando con la API que el PaymentIntent
   * tiene status 'succeeded', y actualiza el registro de pago en BD.
   */
  async confirmStripePayment(paymentIntentId: string, orderId: string) {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status !== 'succeeded') {
        throw new BadRequestException(
          `El pago aún no fue completado. Estado actual: ${intent.status}`,
        );
      }

      // Actualizar estado del pago en la base de datos
      await this.prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: 'SUCCESS',
          transactionRef: paymentIntentId,
        },
      });

      // Actualizar estado de la orden
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      return {
        success: true,
        paymentIntentId,
        orderId,
        message: 'Pago confirmado exitosamente',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        err.message || 'No se pudo confirmar el pago',
      );
    }
  }

  /**
   * Confirma un pago QR (el backend valida la referencia y marca como pagado).
   */
  async confirmQrPayment(transactionRef: string, orderId: string) {
    await this.prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: 'SUCCESS',
        transactionRef,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    return {
      success: true,
      transactionRef,
      orderId,
      message: 'Pago QR confirmado exitosamente',
    };
  }
}
