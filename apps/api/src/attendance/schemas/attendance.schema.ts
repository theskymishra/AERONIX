import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AttendanceDocument = HydratedDocument<Attendance>;

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
}

export enum AttendanceWorkMode {
  OFFICE = 'OFFICE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}

@Schema({
  timestamps: true,
  collection: 'attendance',
})
export class Attendance {
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
    index: true,
  })
  date!: Date;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AttendanceStatus),
    default: AttendanceStatus.PRESENT,
    index: true,
  })
  status!: AttendanceStatus;

  @Prop({
    type: Date,
  })
  checkInAt?: Date;

  @Prop({
    type: Date,
  })
  checkOutAt?: Date;

  @Prop({
    type: Number,
    min: 0,
  })
  workedMinutes?: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AttendanceWorkMode),
    default: AttendanceWorkMode.OFFICE,
  })
  workMode!: AttendanceWorkMode;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  notes?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  recordedBy!: Types.ObjectId;
}

export const AttendanceSchema =
  SchemaFactory.createForClass(Attendance);

AttendanceSchema.index(
  {
    organizationId: 1,
    employeeId: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

AttendanceSchema.index({
  organizationId: 1,
  date: -1,
});

AttendanceSchema.index({
  organizationId: 1,
  employeeId: 1,
  date: -1,
});

AttendanceSchema.index({
  organizationId: 1,
  status: 1,
  date: -1,
});
