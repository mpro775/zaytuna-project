import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationQueueService } from './notification-queue.service';
import { EmailProvider } from './providers/email.provider';
import { SMSProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationTemplateService,
    NotificationPreferencesService,
    NotificationQueueService,
    EmailProvider,
    SMSProvider,
    WhatsAppProvider,
    PrismaService,
  ],
  exports: [
    NotificationService,
    NotificationTemplateService,
    NotificationPreferencesService,
    NotificationQueueService,
  ],
})
export class NotificationModule {}
