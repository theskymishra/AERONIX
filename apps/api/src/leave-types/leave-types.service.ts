import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LeaveType,
  LeaveTypeDocument,
} from './schemas/leave-type.schema.js';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto.js';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto.js';
import { LeaveTypeQueryDto } from './dto/leave-type-query.dto.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

@Injectable()
export class LeaveTypesService {
  constructor(
    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  async create(
    dto: CreateLeaveTypeDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    if (
      dto.carryForwardAllowed === false &&
      dto.maxCarryForwardDays !== undefined &&
      dto.maxCarryForwardDays > 0
    ) {
      throw new BadRequestException(
        'maxCarryForwardDays must be 0 or omitted when carryForwardAllowed is false',
      );
    }

    try {
      const leaveType = await this.leaveTypeModel.create({
        ...dto,
        organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        maxCarryForwardDays:
          dto.carryForwardAllowed === false
            ? undefined
            : dto.maxCarryForwardDays,
      });

      return leaveType;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'A leave type with this name or code already exists',
        );
      }

      throw error;
    }
  }

  async findAll(
    query: LeaveTypeQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search?.trim()) {
      const search = this.escapeRegex(query.search.trim());

      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.leaveTypeModel
        .find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.leaveTypeModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const leaveTypeId = this.toObjectId(id);

    const leaveType = await this.leaveTypeModel
      .findOne({
        _id: leaveTypeId,
        organizationId,
      })
      .exec();

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    return leaveType;
  }

  async update(
    id: string,
    dto: UpdateLeaveTypeDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const leaveTypeId = this.toObjectId(id);

    if (
      dto.carryForwardAllowed === false &&
      dto.maxCarryForwardDays !== undefined &&
      dto.maxCarryForwardDays > 0
    ) {
      throw new BadRequestException(
        'maxCarryForwardDays must be 0 or omitted when carryForwardAllowed is false',
      );
    }

    const update: Record<string, unknown> = {
      ...dto,
    };

    if (dto.code !== undefined) {
      update.code = dto.code.trim().toUpperCase();
    }

    if (dto.name !== undefined) {
      update.name = dto.name.trim();
    }

    if (dto.carryForwardAllowed === false) {
      update.maxCarryForwardDays = undefined;
    }

    try {
      const leaveType = await this.leaveTypeModel
        .findOneAndUpdate(
          {
            _id: leaveTypeId,
            organizationId,
          },
          update,
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

      if (!leaveType) {
        throw new NotFoundException('Leave type not found');
      }

      return leaveType;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'A leave type with this name or code already exists',
        );
      }

      throw error;
    }
  }

  async deactivate(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const leaveTypeId = this.toObjectId(id);

    const leaveType = await this.leaveTypeModel
      .findOneAndUpdate(
        {
          _id: leaveTypeId,
          organizationId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        },
      )
      .exec();

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    return leaveType;
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ObjectId');
    }

    return new Types.ObjectId(value);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
