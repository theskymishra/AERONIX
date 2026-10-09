import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationPreferenceDocument = HydratedDocument<NotificationPreference>;

@Schema({
  timestamps: true,
  collection: 'notification_preferences',
})
export class NotificationPreference {
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

  @Prop({ default: true })
  emailNotifications!: boolean;

  @Prop({ default: true })
  inAppNotifications!: boolean;

  @Prop({ default: true })
  leaveUpdates!: boolean;

  @Prop({ default: true })
  payrollUpdates!: boolean;

  @Prop({ default: true })
  performanceUpdates!: boolean;

  @Prop({ default: true })
  recruitmentUpdates!: boolean;

  @Prop({ default: true })
  announcementUpdates!: boolean;
}

export const NotificationPreferenceSchema =
  SchemaFactory.createForClass(NotificationPreference);

NotificationPreferenceSchema.index(
  {
    organizationId: 1,
    userId: 1,
  },
  { unique: true },
);
