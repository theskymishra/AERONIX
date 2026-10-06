import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CandidateDocument = HydratedDocument<Candidate>;

export enum CandidateSource {
  CAREER_PAGE = 'CAREER_PAGE',
  REFERRAL = 'REFERRAL',
  LINKEDIN = 'LINKEDIN',
  AGENCY = 'AGENCY',
  JOB_PORTAL = 'JOB_PORTAL',
  DIRECT = 'DIRECT',
  OTHER = 'OTHER',
}

@Schema({
  timestamps: true,
  collection: 'candidates',
})
export class Candidate {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  firstName!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  lastName!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true, maxlength: 30 })
  phone?: string;

  @Prop({ trim: true, maxlength: 150 })
  location?: string;

  @Prop({ trim: true, maxlength: 150 })
  currentCompany?: string;

  @Prop({ trim: true, maxlength: 150 })
  currentJobTitle?: string;

  @Prop({ min: 0, max: 60 })
  experienceYears?: number;

  @Prop({
    type: [String],
    default: [],
  })
  skills!: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'EmployeeDocument',
  })
  resumeDocumentId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(CandidateSource),
  })
  source?: CandidateSource;

  @Prop({ trim: true, maxlength: 3000 })
  notes?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  updatedBy?: Types.ObjectId;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

CandidateSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true },
);

CandidateSchema.index({
  organizationId: 1,
  lastName: 1,
  firstName: 1,
});

CandidateSchema.index({
  organizationId: 1,
  skills: 1,
});

CandidateSchema.index({
  organizationId: 1,
  createdAt: -1,
});