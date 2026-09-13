import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  CareerEvent,
  CareerEventType,
} from './schemas/career-event.schema.js';

@Injectable()
export class CareerEventsService {
  constructor(
    @InjectModel(CareerEvent.name)
    private readonly careerEventModel:
      Model<CareerEvent>,
  ) {}

  async create(
    organizationId: string,
    employeeId: string,
    createdBy: string,
    data: {
      type: CareerEventType;
      title: string;
      description?: string;
      effectiveDate: Date;
      metadata?: Record<string, unknown>;
    },
  ): Promise<CareerEvent> {
    const event =
      await this.careerEventModel.create({
        organizationId:
          this.toObjectId(organizationId),
        employeeId:
          this.toObjectId(employeeId),
        createdBy:
          this.toObjectId(createdBy),
        type: data.type,
        title: data.title,
        description: data.description,
        effectiveDate: data.effectiveDate,
        metadata: data.metadata ?? {},
      });

    return event;
  }

  async recordChange(
  organizationId: string,
  employeeId: string,
  createdBy: string,
  data: {
    type: CareerEventType;
    title: string;
    oldValue: unknown;
    newValue: unknown;
    effectiveDate: Date;
  },
): Promise<CareerEvent> {
  return this.create(
    organizationId,
    employeeId,
    createdBy,
    {
      type: data.type,
      title: data.title,
      effectiveDate: data.effectiveDate,
      metadata: {
        oldValue: data.oldValue,
        newValue: data.newValue,
      },
    },
  );
}

  async findByEmployee(
    organizationId: string,
    employeeId: string,
  ): Promise<CareerEvent[]> {
    const events =
      await this.careerEventModel
        .find({
          organizationId:
            this.toObjectId(organizationId),
          employeeId:
            this.toObjectId(employeeId),
        })
        .sort({
          effectiveDate: -1,
          createdAt: -1,
        })
        .lean();

    return events;
  }

  async findOne(
    organizationId: string,
    employeeId: string,
    eventId: string,
  ): Promise<CareerEvent> {
    const event =
      await this.careerEventModel.findOne({
        _id: this.toObjectId(eventId),
        organizationId:
          this.toObjectId(organizationId),
        employeeId:
          this.toObjectId(employeeId),
      });

    if (!event) {
      throw new NotFoundException(
        'Career event not found',
      );
    }

    return event;
  }

  private toObjectId(
    value: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException(
        'Invalid identifier',
      );
    }

    return new Types.ObjectId(value);
  }
}