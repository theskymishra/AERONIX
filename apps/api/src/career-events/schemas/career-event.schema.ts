import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type CareerEventDocument =
  HydratedDocument<CareerEvent>;

export enum CareerEventType {
  JOINED = 'JOINED',
  PROMOTION = 'PROMOTION',
  DESIGNATION_CHANGE = 'DESIGNATION_CHANGE',
  DEPARTMENT_CHANGE = 'DEPARTMENT_CHANGE',
  TEAM_CHANGE = 'TEAM_CHANGE',
  MANAGER_CHANGE = 'MANAGER_CHANGE',
  EMPLOYMENT_TYPE_CHANGE = 'EMPLOYMENT_TYPE_CHANGE',
  LOCATION_CHANGE = 'LOCATION_CHANGE',
  WORK_MODE_CHANGE = 'WORK_MODE_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  EXITED = 'EXITED',
}

@Schema({
  timestamps: true,
  collection: 'career_events',
})
export class CareerEvent {
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
    type: String,
    required: true,
    enum: Object.values(CareerEventType),
    index: true,
  })
  type!: CareerEventType;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 160,
  })
  title!: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  description?: string;

  @Prop({
    required: true,
    index: true,
  })
  effectiveDate!: Date;

  @Prop({
    type: Object,
    default: {},
  })
  metadata!: Record<string, unknown>;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: Types.ObjectId;
}

export const CareerEventSchema =
  SchemaFactory.createForClass(CareerEvent);

CareerEventSchema.index({
  organizationId: 1,
  employeeId: 1,
  effectiveDate: -1,
});

CareerEventSchema.index({
  organizationId: 1,
  employeeId: 1,
  type: 1,
});