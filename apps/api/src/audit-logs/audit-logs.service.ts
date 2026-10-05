import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  AuditAction,
  AuditEntity,
  AuditLog,
} from './schemas/audit-log.schema.js';

import { AuditLogQueryDto } from './dto/audit-log-query.dto.js';

import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async record(params: {
    user: AuthenticatedUser;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string | Types.ObjectId;
    metadata?: Record<string, unknown>;
  }) {
    const organizationId = this.toObjectId(
      params.user.organizationId,
    );

    const actorId = this.toObjectId(
      params.user.userId,
    );

    const entityId =
      params.entityId instanceof Types.ObjectId
        ? params.entityId
        : this.toObjectId(params.entityId);

    return this.auditLogModel.create({
      organizationId,
      actorId,
      action: params.action,
      entity: params.entity,
      entityId,
      metadata: params.metadata ?? {},
    });
  }

  async findAll(
    query: AuditLogQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(
      user.organizationId,
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.action !== undefined) {
      filter.action = query.action;
    }

    if (query.entity !== undefined) {
      filter.entity = query.entity;
    }

    if (query.actorId !== undefined) {
      filter.actorId = this.toObjectId(
        query.actorId,
      );
    }

    if (query.entityId !== undefined) {
      filter.entityId = this.toObjectId(
        query.entityId,
      );
    }

    if (
      query.fromDate !== undefined ||
      query.toDate !== undefined
    ) {
      const createdAt: Record<string, Date> = {};

      if (query.fromDate !== undefined) {
        createdAt.$gte = new Date(
          query.fromDate,
        );
      }

      if (query.toDate !== undefined) {
        createdAt.$lte = new Date(
          query.toDate,
        );
      }

      filter.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.auditLogModel
        .countDocuments(filter)
        .exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit,
      ),
    };
  }

  async findByEntity(
    entity: AuditEntity,
    entityId: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(
      user.organizationId,
    );

    const targetEntityId =
      this.toObjectId(entityId);

    return this.auditLogModel
      .find({
        organizationId,
        entity,
        entityId: targetEntityId,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  private toObjectId(
    value: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        'Invalid ObjectId',
      );
    }

    return new Types.ObjectId(value);
  }
}
