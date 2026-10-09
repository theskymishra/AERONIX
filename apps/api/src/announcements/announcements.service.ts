import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema.js';
import {
  NotificationCategory,
  NotificationType,
} from '../notifications/schemas/notification.schema.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';
import { RolesService } from '../roles/roles.service.js';

import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';
import { AnnouncementQueryDto } from './dto/announcement-query.dto.js';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto.js';
import {
  Announcement,
  AnnouncementDocument,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetAudience,
} from './schemas/announcement.schema.js';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,

    private readonly rolesService: RolesService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateAnnouncementDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const announcement = await this.announcementModel.create({
      organizationId,
      title: dto.title,
      content: dto.content,
      status: AnnouncementStatus.DRAFT,
      priority: dto.priority ?? AnnouncementPriority.NORMAL,
      targetAudience:
        dto.targetAudience ?? AnnouncementTargetAudience.ALL,
      targetDepartmentIds: (dto.targetDepartmentIds ?? []).map((id) =>
        this.toObjectId(id),
      ),
      targetRoles: dto.targetRoles ?? [],
      createdBy: this.toObjectId(user.userId),
    });

    await this.audit(
      user,
      AuditAction.CREATE,
      announcement,
      'CREATE',
    );

    return announcement;
  }

  async findAll(
    user: AuthenticatedUser,
    query: AnnouncementQueryDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const permissions = await this.rolesService.getUserPermissions(
      user.userId,
      user.organizationId,
    );
    const canManage = permissions.includes(
      PERMISSIONS.ANNOUNCEMENT_MANAGE,
    );

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (canManage) {
      if (query.status) {
        filter.status = query.status;
      }
    } else {
      filter.status = AnnouncementStatus.PUBLISHED;

      const employee = await this.employeeModel
        .findOne({
          userId: this.toObjectId(user.userId),
          organizationId,
        })
        .lean()
        .exec();

      const audienceConditions: Record<string, unknown>[] = [
        { targetAudience: AnnouncementTargetAudience.ALL },
      ];

      if (employee?.departmentId) {
        audienceConditions.push({
          targetAudience: AnnouncementTargetAudience.DEPARTMENT,
          targetDepartmentIds: employee.departmentId,
        });
      }

      filter.$or = audienceConditions;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.targetAudience) {
      filter.targetAudience = query.targetAudience;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.announcementModel
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean()
        .exec(),

      this.announcementModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(
    user: AuthenticatedUser,
    id: string,
  ) {
    const announcement = await this.announcementModel
      .findOne({
        _id: this.toObjectId(id),
        organizationId: this.toObjectId(user.organizationId),
      })
      .lean()
      .exec();

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.status !== AnnouncementStatus.PUBLISHED) {
      const permissions = await this.rolesService.getUserPermissions(
        user.userId,
        user.organizationId,
      );
      const canManage = permissions.includes(
        PERMISSIONS.ANNOUNCEMENT_MANAGE,
      );

      if (!canManage) {
        throw new NotFoundException('Announcement not found');
      }
    }

    return announcement;
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateAnnouncementDto,
  ) {
    const announcement = await this.getAnnouncementDocument(
      user.organizationId,
      id,
    );

    if (announcement.status === AnnouncementStatus.ARCHIVED) {
      throw new ConflictException(
        'An archived announcement cannot be updated',
      );
    }

    if (dto.title !== undefined) {
      announcement.title = dto.title;
    }

    if (dto.content !== undefined) {
      announcement.content = dto.content;
    }

    if (dto.priority !== undefined) {
      announcement.priority = dto.priority;
    }

    if (dto.targetAudience !== undefined) {
      announcement.targetAudience = dto.targetAudience;
    }

    if (dto.targetDepartmentIds !== undefined) {
      announcement.targetDepartmentIds = dto.targetDepartmentIds.map(
        (deptId) => this.toObjectId(deptId),
      );
    }

    if (dto.targetRoles !== undefined) {
      announcement.targetRoles = dto.targetRoles;
    }

    announcement.updatedBy = this.toObjectId(user.userId);

    await announcement.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      announcement,
      'UPDATE',
    );

    return announcement;
  }

  async publish(
    user: AuthenticatedUser,
    id: string,
  ) {
    const announcement = await this.getAnnouncementDocument(
      user.organizationId,
      id,
    );

    if (announcement.status !== AnnouncementStatus.DRAFT) {
      throw new ConflictException(
        'Only a draft announcement can be published',
      );
    }

    announcement.status = AnnouncementStatus.PUBLISHED;
    announcement.publishedAt = new Date();
    announcement.publishedBy = this.toObjectId(user.userId);
    announcement.updatedBy = this.toObjectId(user.userId);

    await announcement.save();

    await this.audit(
      user,
      AuditAction.APPROVE,
      announcement,
      'PUBLISH',
    );

    // Broadcast notification to targeted active employees
    try {
      const empFilter: Record<string, unknown> = {
        organizationId: announcement.organizationId,
        employmentStatus: 'ACTIVE',
      };

      if (
        announcement.targetAudience ===
          AnnouncementTargetAudience.DEPARTMENT &&
        announcement.targetDepartmentIds.length > 0
      ) {
        empFilter.departmentId = {
          $in: announcement.targetDepartmentIds,
        };
      }

      const activeEmployees = await this.employeeModel
        .find(empFilter)
        .select('userId')
        .lean()
        .exec();

      const userIds = activeEmployees
        .map((emp) => emp.userId)
        .filter(Boolean);

      if (userIds.length > 0) {
        await this.notificationsService.sendBatchNotification(
          announcement.organizationId,
          userIds,
          {
            title: `Announcement: ${announcement.title}`,
            message:
              announcement.content.length > 200
                ? `${announcement.content.substring(0, 197)}...`
                : announcement.content,
            type: NotificationType.INFO,
            category: NotificationCategory.ANNOUNCEMENT,
            link: `/announcements/${announcement._id}`,
          },
        );
      }
    } catch {
      // Do not fail publish if notification broadcast encounters an issue
    }

    return announcement;
  }

  async archive(
    user: AuthenticatedUser,
    id: string,
  ) {
    const announcement = await this.getAnnouncementDocument(
      user.organizationId,
      id,
    );

    if (announcement.status !== AnnouncementStatus.PUBLISHED) {
      throw new ConflictException(
        'Only a published announcement can be archived',
      );
    }

    announcement.status = AnnouncementStatus.ARCHIVED;
    announcement.archivedAt = new Date();
    announcement.archivedBy = this.toObjectId(user.userId);
    announcement.updatedBy = this.toObjectId(user.userId);

    await announcement.save();

    await this.audit(
      user,
      AuditAction.CANCEL,
      announcement,
      'ARCHIVE',
    );

    return announcement;
  }

  private async getAnnouncementDocument(
    organizationId: string,
    announcementId: string,
  ): Promise<AnnouncementDocument> {
    const announcement = await this.announcementModel.findOne({
      _id: this.toObjectId(announcementId),
      organizationId: this.toObjectId(organizationId),
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  private async audit(
    user: AuthenticatedUser,
    action: AuditAction,
    announcement: AnnouncementDocument | { _id: Types.ObjectId },
    lifecycle: string,
  ) {
    await this.auditLogsService.record({
      user,
      action,
      entity: AuditEntity.ANNOUNCEMENT,
      entityId: announcement._id,
      metadata: {
        lifecycle,
      },
    });
  }

  private toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ID');
    }

    return new Types.ObjectId(value);
  }
}
