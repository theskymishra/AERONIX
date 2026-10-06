import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JobOpeningDocument = HydratedDocument<JobOpening>;

export enum JobOpeningStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
}

export enum WorkMode {
  OFFICE = 'OFFICE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}

@Schema({
  timestamps: true,
  collection: 'job_openings',
})
export class JobOpening {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ trim: true, maxlength: 100 })
  department?: string;

  @Prop({ trim: true, maxlength: 100 })
  team?: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  hiringManagerId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(EmploymentType),
    type: String,
  })
  employmentType!: EmploymentType;

  @Prop({
    required: true,
    enum: Object.values(WorkMode),
    type: String,
  })
  workMode!: WorkMode;

  @Prop({ trim: true, maxlength: 150 })
  location?: string;

  @Prop({ min: 0 })
  salaryMin?: number;

  @Prop({ min: 0 })
  salaryMax?: number;

  @Prop({ trim: true, maxlength: 50 })
  salaryCurrency?: string;

  @Prop({ trim: true, maxlength: 3000 })
  description?: string;

  @Prop({ trim: true, maxlength: 3000 })
  requirements?: string;

  @Prop({ type: [String], default: [] })
  requiredSkills!: string[];

  @Prop({
    required: true,
    enum: Object.values(JobOpeningStatus),
    type: String,
    default: JobOpeningStatus.DRAFT,
    index: true,
  })
  status!: JobOpeningStatus;

  @Prop()
  publishedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop({ trim: true, maxlength: 1000 })
  notes?: string;

  @Prop({ type: Types.ObjectId, required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  closedBy?: Types.ObjectId;
}

export const JobOpeningSchema = SchemaFactory.createForClass(JobOpening);

JobOpeningSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

JobOpeningSchema.index({
  organizationId: 1,
  department: 1,
  status: 1,
});

JobOpeningSchema.index({
  organizationId: 1,
  hiringManagerId: 1,
  status: 1,
});

JobOpeningSchema.index({
  organizationId: 1,
  employmentType: 1,
  workMode: 1,
});
