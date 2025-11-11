import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import { PaymentSecurityService } from './payment-security.service';
import { RefundService } from './refund.service';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    PaymentAdapterFactory,
    PaymentSecurityService,
    RefundService,
    ReconciliationService,
    PrismaService,
    CacheService,
  ],
  exports: [
    PaymentService,
    PaymentAdapterFactory,
    PaymentSecurityService,
    RefundService,
    ReconciliationService,
  ],
})
export class PaymentModule {}
