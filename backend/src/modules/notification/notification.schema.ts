import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({
  timestamps: true,
  collection: 'notifications'
})
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop()
  type: string; // 'push', 'email', 'sms', 'in_app'

  @Prop()
  category: string; // 'sales', 'inventory', 'system', 'marketing'

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop()
  actionUrl?: string;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: Date;

  // Push notification specific fields
  @Prop()
  pushSubscriptionId?: string;

  @Prop()
  deviceId?: string;

  // Email specific fields
  @Prop()
  emailSent?: boolean;

  @Prop()
  emailOpened?: boolean;

  // SMS specific fields
  @Prop()
  smsSent?: boolean;

  @Prop()
  smsDelivered?: boolean;

  // Metadata
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// إضافة indexes للأداء
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ category: 1, createdAt: -1 });
NotificationSchema.index({ pushSubscriptionId: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
