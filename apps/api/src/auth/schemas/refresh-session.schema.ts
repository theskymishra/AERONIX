import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefreshSessionDocument =
  HydratedDocument<RefreshSession>;

@Schema({
  timestamps: true,
  collection: 'refresh_sessions',
})
export class RefreshSession {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    required: true,
    select: false,
  })
  tokenHash!: string;

  @Prop({
    required: true,
  })
  expiresAt!: Date;

  @Prop()
  revokedAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop({
    maxlength: 64,
  })
  ipAddress?: string;

  @Prop({
    maxlength: 512,
  })
  userAgent?: string;
}

export const RefreshSessionSchema =
  SchemaFactory.createForClass(RefreshSession);

RefreshSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

RefreshSessionSchema.index({
  userId: 1,
  revokedAt: 1,
});