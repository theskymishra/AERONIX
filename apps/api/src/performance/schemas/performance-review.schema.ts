import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PerformanceReviewDocument =
  HydratedDocument<PerformanceReview>;

export enum PerformanceReviewStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  COMPLETED = 'COMPLETED',
}

@Schema({
  timestamps: true,
  collection: 'performance_reviews',
})
export class PerformanceReview {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  employeeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  reviewerId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 150 })
  reviewPeriod!: string;

  @Prop({
    required: true,
    enum: Object.values(PerformanceReviewStatus),
    type: String,
    default: PerformanceReviewStatus.DRAFT,
    index: true,
  })
  status!: PerformanceReviewStatus;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({ trim: true, maxlength: 3000 })
  strengths?: string;

  @Prop({ trim: true, maxlength: 3000 })
  areasForImprovement?: string;

  @Prop({ trim: true, maxlength: 3000 })
  comments?: string;

  @Prop()
  submittedAt?: Date;

  @Prop()
  acknowledgedAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const PerformanceReviewSchema =
  SchemaFactory.createForClass(PerformanceReview);

PerformanceReviewSchema.index({
  organizationId: 1,
  employeeId: 1,
  reviewPeriod: 1,
});

PerformanceReviewSchema.index({
  organizationId: 1,
  reviewerId: 1,
  status: 1,
});

PerformanceReviewSchema.index({
  organizationId: 1,
  employeeId: 1,
  createdAt: -1,
});
