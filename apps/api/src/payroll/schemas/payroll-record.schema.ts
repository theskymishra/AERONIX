import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayrollRecordDocument = HydratedDocument<PayrollRecord>;

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  PROCESSED = 'PROCESSED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Schema({
  timestamps: true,
  collection: 'payroll_records',
})
export class PayrollRecord {
  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  employeeId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  payPeriod!: string;

  @Prop({
    required: true,
    enum: Object.values(PayrollStatus),
    type: String,
    default: PayrollStatus.DRAFT,
    index: true,
  })
  status!: PayrollStatus;

  @Prop({
    required: true,
    min: 0,
  })
  basicSalary!: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  allowances!: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  deductions!: number;

  @Prop({
    required: true,
    min: 0,
  })
  grossSalary!: number;

  @Prop({
    required: true,
    min: 0,
  })
  netSalary!: number;

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
  })
  processedBy?: Types.ObjectId;

  @Prop()
  processedAt?: Date;

  @Prop({
    type: Types.ObjectId,
  })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({
    type: Types.ObjectId,
  })
  paidBy?: Types.ObjectId;

  @Prop()
  paidAt?: Date;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  notes?: string;
}

export const PayrollRecordSchema =
  SchemaFactory.createForClass(PayrollRecord);

PayrollRecordSchema.index(
  {
    organizationId: 1,
    employeeId: 1,
    payPeriod: 1,
  },
  {
    unique: true,
  },
);

PayrollRecordSchema.index({
  organizationId: 1,
  payPeriod: 1,
});

PayrollRecordSchema.index({
  organizationId: 1,
  status: 1,
  payPeriod: 1,
});