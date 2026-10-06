import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoalDocument = HydratedDocument<Goal>;

export enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Schema({
  timestamps: true,
  collection: 'goals',
})
export class Goal {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  employeeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ trim: true, maxlength: 100 })
  category?: string;

  @Prop({
    required: true,
    enum: Object.values(GoalPriority),
    type: String,
    default: GoalPriority.MEDIUM,
  })
  priority!: GoalPriority;

  @Prop({
    required: true,
    enum: Object.values(GoalStatus),
    type: String,
    default: GoalStatus.DRAFT,
    index: true,
  })
  status!: GoalStatus;

  @Prop({ required: true, min: 0, max: 100, default: 0 })
  progress!: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ type: Types.ObjectId })
  completedBy?: Types.ObjectId;

  @Prop()
  completedAt?: Date;

  @Prop({ trim: true, maxlength: 1000 })
  notes?: string;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

GoalSchema.index({
  organizationId: 1,
  employeeId: 1,
  status: 1,
});

GoalSchema.index({
  organizationId: 1,
  dueDate: 1,
});

GoalSchema.index({
  organizationId: 1,
  employeeId: 1,
  startDate: -1,
});
