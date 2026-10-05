import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LeaveRequestDocument = HydratedDocument<LeaveRequest>;

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'leave_requests' })
export class LeaveRequest {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  })
  employeeId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'LeaveType',
    required: true,
    index: true,
  })
  leaveTypeId!: Types.ObjectId;

  @Prop({
    required: true,
    index: true,
  })
  startDate!: Date;

  @Prop({
    required: true,
    index: true,
  })
  endDate!: Date;

  @Prop({
    required: true,
    min: 1,
  })
  totalDays!: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(LeaveRequestStatus),
    default: LeaveRequestStatus.PENDING,
    index: true,
  })
  status!: LeaveRequestStatus;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  reason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  approvedBy?: Types.ObjectId;

  @Prop({
    type: Date,
  })
  approvedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  rejectedBy?: Types.ObjectId;

  @Prop({
    type: Date,
  })
  rejectedAt?: Date;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  rejectionReason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  cancelledBy?: Types.ObjectId;

  @Prop({
    type: Date,
  })
  cancelledAt?: Date;
}

export const LeaveRequestSchema =
  SchemaFactory.createForClass(LeaveRequest);

LeaveRequestSchema.index({
  organizationId: 1,
  employeeId: 1,
  startDate: -1,
});

LeaveRequestSchema.index({
  organizationId: 1,
  status: 1,
  startDate: -1,
});

LeaveRequestSchema.index({
  organizationId: 1,
  leaveTypeId: 1,
  startDate: -1,
});
