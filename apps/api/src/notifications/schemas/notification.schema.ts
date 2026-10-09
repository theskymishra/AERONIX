import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
}

export enum NotificationCategory {
  SYSTEM = 'SYSTEM',
  LEAVE = 'LEAVE',
  ATTENDANCE = 'ATTENDANCE',
  PAYROLL = 'PAYROLL',
  PERFORMANCE = 'PERFORMANCE',
  RECRUITMENT = 'RECRUITMENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  message!: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    default: NotificationType.INFO,
  })
  type!: NotificationType;

  @Prop({
    type: String,
    enum: Object.values(NotificationCategory),
    required: true,
    default: NotificationCategory.SYSTEM,
  })
  category!: NotificationCategory;

  @Prop({ required: true, default: false, index: true })
  isRead!: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ trim: true, maxlength: 500 })
  link?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({
  organizationId: 1,
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

NotificationSchema.index({
  organizationId: 1,
  userId: 1,
  createdAt: -1,
});
