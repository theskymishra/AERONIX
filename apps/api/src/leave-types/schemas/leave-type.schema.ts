import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LeaveTypeDocument = HydratedDocument<LeaveType>;

@Schema({ timestamps: true, collection: 'leave_types' })
export class LeaveType {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  name!: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 30,
  })
  code!: string;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    required: true,
    min: 0,
    max: 365,
  })
  annualAllocation!: number;

  @Prop({
    required: true,
    default: false,
  })
  carryForwardAllowed!: boolean;

  @Prop({
    type: Number,
    min: 0,
    max: 365,
  })
  maxCarryForwardDays?: number;

  @Prop({
    required: true,
    default: true,
  })
  requiresApproval!: boolean;

  @Prop({
    required: true,
    default: true,
  })
  isPaid!: boolean;

  @Prop({
    required: true,
    default: true,
    index: true,
  })
  isActive!: boolean;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);

LeaveTypeSchema.index(
  { organizationId: 1, code: 1 },
  { unique: true },
);

LeaveTypeSchema.index(
  { organizationId: 1, name: 1 },
  { unique: true },
);

LeaveTypeSchema.index({
  organizationId: 1,
  isActive: 1,
});
