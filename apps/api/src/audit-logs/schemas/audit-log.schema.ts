import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
}

export enum AuditEntity {
  ATTENDANCE = 'ATTENDANCE',
  LEAVE_REQUEST = 'LEAVE_REQUEST',
  PAYROLL = 'PAYROLL',
  GOAL = 'GOAL',
  PERFORMANCE_REVIEW = 'PERFORMANCE_REVIEW',
}

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  timestamps: true,
  collection: 'audit_logs',
})
export class AuditLog {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  actorId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true,
  })
  action: AuditAction;

  @Prop({
    type: String,
    enum: Object.values(AuditEntity),
    required: true,
    index: true,
  })
  entity: AuditEntity;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  entityId: Types.ObjectId;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export const AuditLogSchema =
  SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({
  organizationId: 1,
  entity: 1,
  entityId: 1,
  createdAt: -1,
});

AuditLogSchema.index({
  organizationId: 1,
  actorId: 1,
  createdAt: -1,
});

AuditLogSchema.index({
  organizationId: 1,
  createdAt: -1,
});
