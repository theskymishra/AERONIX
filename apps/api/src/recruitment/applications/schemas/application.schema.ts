import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApplicationDocument = HydratedDocument<Application>;

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFERED = 'OFFERED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

@Schema({
  timestamps: true,
  collection: 'applications',
})
export class Application {
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
    type: String,
    enum: Object.values(ApplicationStatus),
    required: true,
    default: ApplicationStatus.APPLIED,
  })
  status!: ApplicationStatus;

  @Prop({ trim: true, maxlength: 5000 })
  coverLetter?: string;

  @Prop({ trim: true, maxlength: 100 })
  source?: string;

  @Prop({ required: true, default: Date.now })
  appliedAt!: Date;

  @Prop()
  screenedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  screenedBy?: Types.ObjectId;

  @Prop()
  shortlistedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy?: Types.ObjectId;

  @Prop()
  rejectedAt?: Date;

  @Prop({ trim: true, maxlength: 2000 })
  rejectionReason?: string;

  @Prop({ trim: true, maxlength: 3000 })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const ApplicationSchema =
  SchemaFactory.createForClass(Application);

ApplicationSchema.index(
  {
    organizationId: 1,
    jobOpeningId: 1,
    candidateId: 1,
  },
  { unique: true },
);

ApplicationSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

ApplicationSchema.index({
  organizationId: 1,
  candidateId: 1,
  createdAt: -1,
});

ApplicationSchema.index({
  organizationId: 1,
  jobOpeningId: 1,
  status: 1,
});