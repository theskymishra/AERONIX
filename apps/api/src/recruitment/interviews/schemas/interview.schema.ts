import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InterviewDocument = HydratedDocument<Interview>;

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  ONSITE = 'ONSITE',
  PANEL = 'PANEL',
  TECHNICAL = 'TECHNICAL',
  HR = 'HR',
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum InterviewRecommendation {
  STRONG_NO = 'STRONG_NO',
  NO = 'NO',
  MAYBE = 'MAYBE',
  YES = 'YES',
  STRONG_YES = 'STRONG_YES',
}

@Schema({
  timestamps: true,
  collection: 'interviews',
})
export class Interview {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'JobOpening',
    required: true,
    index: true,
  })
  jobOpeningId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Candidate',
    required: true,
    index: true,
  })
  candidateId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  })
  applicationId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(InterviewType),
    required: true,
  })
  type!: InterviewType;

  @Prop({
    type: String,
    enum: Object.values(InterviewStatus),
    required: true,
    default: InterviewStatus.SCHEDULED,
  })
  status!: InterviewStatus;

  @Prop({ required: true })
  scheduledAt!: Date;

  @Prop({ required: true, min: 15, max: 480 })
  durationMinutes!: number;

  @Prop({ trim: true, maxlength: 200 })
  location?: string;

  @Prop({ trim: true, maxlength: 500 })
  meetingLink?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
  })
  interviewerIds!: Types.ObjectId[];

  @Prop({ trim: true, maxlength: 5000 })
  feedback?: string;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({
    type: String,
    enum: Object.values(InterviewRecommendation),
  })
  recommendation?: InterviewRecommendation;

  @Prop({ trim: true, maxlength: 3000 })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  @Prop()
  completedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop({ trim: true, maxlength: 2000 })
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Interview' })
  rescheduledFromId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

InterviewSchema.index({
  organizationId: 1,
  applicationId: 1,
  scheduledAt: 1,
});

InterviewSchema.index({
  organizationId: 1,
  candidateId: 1,
  scheduledAt: -1,
});

InterviewSchema.index({
  organizationId: 1,
  jobOpeningId: 1,
  scheduledAt: -1,
});

InterviewSchema.index({
  organizationId: 1,
  status: 1,
  scheduledAt: 1,
});

InterviewSchema.index({
  organizationId: 1,
  interviewerIds: 1,
  scheduledAt: 1,
});
