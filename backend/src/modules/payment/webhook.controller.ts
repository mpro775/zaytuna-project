import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';

@Controller('payment/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly adapterFactory: PaymentAdapterFactory,
  ) {}

  /**
   * Webhook من Stripe
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature?: string,
  ) {
    try {
      this.logger.log('Received Stripe webhook');

      await this.paymentService.processWebhook({
        gateway: 'stripe',
        eventType: payload.type,
        transactionId: payload.data?.object?.id || payload.data?.object?.payment_intent,
        data: payload,
        signature,
      });

      return { received: true };
    } catch (error) {
      this.logger.error('Stripe webhook processing failed', error);
      throw error;
    }
  }

  /**
   * Webhook من PayPal
   */
  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async paypalWebhook(
    @Body() payload: any,
    @Headers('paypal-transmission-id') transmissionId?: string,
    @Headers('paypal-transmission-time') transmissionTime?: string,
    @Headers('paypal-cert-url') certUrl?: string,
    @Headers('paypal-signature') signature?: string,
  ) {
    try {
      this.logger.log('Received PayPal webhook');

      await this.paymentService.processWebhook({
        gateway: 'paypal',
        eventType: payload.event_type,
        transactionId: payload.resource?.id || payload.resource?.purchase_units?.[0]?.reference_id,
        data: payload,
        signature,
      });

      return { received: true };
    } catch (error) {
      this.logger.error('PayPal webhook processing failed', error);
      throw error;
    }
  }

  /**
   * Webhook من Tap
   */
  @Post('tap')
  @HttpCode(HttpStatus.OK)
  async tapWebhook(
    @Body() payload: any,
    @Headers('x-tap-signature') signature?: string,
  ) {
    try {
      this.logger.log('Received Tap webhook');

      await this.paymentService.processWebhook({
        gateway: 'tap',
        eventType: payload.type,
        transactionId: payload.data?.id || payload.data?.reference?.transaction,
        data: payload,
        signature,
      });

      return { received: true };
    } catch (error) {
      this.logger.error('Tap webhook processing failed', error);
      throw error;
    }
  }

  /**
   * Webhook عام لجميع البوابات
   */
  @Post(':gateway')
  @HttpCode(HttpStatus.OK)
  async genericWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Param('gateway') gateway: string,
  ) {
    try {
      this.logger.log(`Received ${gateway} webhook`);

      // استخراج transaction ID حسب البوابة
      let transactionId: string;
      let eventType: string;

      switch (gateway) {
        case 'stripe':
          transactionId = payload.data?.object?.id || payload.data?.object?.payment_intent;
          eventType = payload.type;
          break;
        case 'paypal':
          transactionId = payload.resource?.id;
          eventType = payload.event_type;
          break;
        case 'tap':
          transactionId = payload.data?.id;
          eventType = payload.type;
          break;
        default:
          transactionId = payload.id || payload.transaction_id;
          eventType = payload.event || payload.type || 'unknown';
      }

      await this.paymentService.processWebhook({
        gateway: gateway as any,
        eventType,
        transactionId,
        data: payload,
        signature: headers['signature'] || headers['stripe-signature'] || headers['x-tap-signature'],
      });

      return { received: true };
    } catch (error) {
      this.logger.error(`${gateway} webhook processing failed`, error);
      throw error;
    }
  }

  /**
   * اختبار webhook (للتطوير فقط)
   */
  @Post('test/:gateway')
  @HttpCode(HttpStatus.OK)
  async testWebhook(
    @Body() payload: any,
    @Param('gateway') gateway: string,
  ) {
    try {
      this.logger.log(`Test webhook received for ${gateway}`);

      // في وضع التطوير، لا نتحقق من التوقيع
      if (process.env.NODE_ENV !== 'production') {
        await this.paymentService.processWebhook({
          gateway: gateway as any,
          eventType: payload.event || payload.type || 'test',
          transactionId: payload.transactionId || payload.id || 'test_transaction',
          data: payload,
        });
      }

      return {
        received: true,
        gateway,
        mode: 'test',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Test webhook failed for ${gateway}`, error);
      throw error;
    }
  }

  /**
   * التحقق من صحة webhook endpoint
   */
  @Post('health/:gateway')
  @HttpCode(HttpStatus.OK)
  async healthCheck(@Param('gateway') gateway: string) {
    try {
      const isAvailable = this.adapterFactory.isGatewayAvailable(gateway as any);

      return {
        gateway,
        status: 'healthy',
        available: isAvailable,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        gateway,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
