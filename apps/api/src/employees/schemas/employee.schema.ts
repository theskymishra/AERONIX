import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({
  timestamps: true,
  collection: 'employees',
})
export class Employee {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30,
  })
  employeeCode!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 80,
  })
  firstName!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 80,
  })
  lastName!: string;

  @Prop({
    trim: true,
    maxlength: 80,
  })
  middleName?: string;

  @Prop({
    trim: true,
    lowercase: true,
    maxlength: 254,
  })
  workEmail?: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  phone?: string;

  @Prop({
    trim: true,
    maxlength: 120,
  })
  jobTitle?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Department',
    index: true,
  })
  departmentId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Team',
    index: true,
  })
  teamId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Employee',
    index: true,
  })
  managerId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACT',
      'INTERN',
      'TEMPORARY',
    ],
    default: 'FULL_TIME',
  })
  employmentType!:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'INTERN'
    | 'TEMPORARY';

  @Prop({
    required: true,
    enum: [
      'ACTIVE',
      'ON_LEAVE',
      'NOTICE_PERIOD',
      'RESIGNED',
      'TERMINATED',
      'RETIRED',
    ],
    default: 'ACTIVE',
    index: true,
  })
  employmentStatus!:
    | 'ACTIVE'
    | 'ON_LEAVE'
    | 'NOTICE_PERIOD'
    | 'RESIGNED'
    | 'TERMINATED'
    | 'RETIRED';

  @Prop({
    required: true,
  })
  joiningDate!: Date;

  @Prop()
  exitDate?: Date;

  @Prop({
    trim: true,
    maxlength: 120,
  })
  location?: string;

  @Prop({
    trim: true,
    maxlength: 80,
  })
  workMode?: string;

  @Prop({
    trim: true,
    maxlength: 120,
  })
  designation?: string;
}

export const EmployeeSchema =
  SchemaFactory.createForClass(Employee);

EmployeeSchema.index(
  { userId: 1 },
  { unique: true },
);

EmployeeSchema.index(
  { organizationId: 1, employeeCode: 1 },
  { unique: true },
);

EmployeeSchema.index(
  { organizationId: 1, workEmail: 1 },
  {
    unique: true,
    sparse: true,
  },
);

EmployeeSchema.index({
  organizationId: 1,
  employmentStatus: 1,
});

EmployeeSchema.index({
  organizationId: 1,
  departmentId: 1,
});

EmployeeSchema.index({
  organizationId: 1,
  managerId: 1,
});