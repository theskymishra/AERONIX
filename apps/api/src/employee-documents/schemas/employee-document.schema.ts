import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum EmployeeDocumentType {
  IDENTITY = 'IDENTITY',
  EDUCATION = 'EDUCATION',
  EMPLOYMENT = 'EMPLOYMENT',
  CONTRACT = 'CONTRACT',
  PAYROLL = 'PAYROLL',
  PERFORMANCE = 'PERFORMANCE',
  LEAVE = 'LEAVE',
  MEDICAL = 'MEDICAL',
  CERTIFICATION = 'CERTIFICATION',
  OTHER = 'OTHER',
}

export enum EmployeeDocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({
  timestamps: true,
  collection: 'employee_documents',
})
export class EmployeeDocument {
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
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 160,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(EmployeeDocumentType),
    index: true,
  })
  type!: EmployeeDocumentType;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    trim: true,
    maxlength: 255,
  })
  originalFileName?: string;

  @Prop({
    trim: true,
    maxlength: 120,
  })
  mimeType?: string;

  @Prop({
    min: 0,
  })
  fileSize?: number;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  storageKey?: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  storageUrl?: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(EmployeeDocumentStatus),
    default: EmployeeDocumentStatus.ACTIVE,
    index: true,
  })
  status!: EmployeeDocumentStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  uploadedBy!: Types.ObjectId;

  @Prop({
    type: Date,
  })
  archivedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  archivedBy?: Types.ObjectId;
}

export const EmployeeDocumentSchema =
  SchemaFactory.createForClass(EmployeeDocument);

EmployeeDocumentSchema.index({
  organizationId: 1,
  employeeId: 1,
  status: 1,
});

EmployeeDocumentSchema.index({
  organizationId: 1,
  employeeId: 1,
  type: 1,
});

EmployeeDocumentSchema.index({
  organizationId: 1,
  employeeId: 1,
  createdAt: -1,
});
