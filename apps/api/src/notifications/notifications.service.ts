import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';
import {
  Notification,
  NotificationCategory,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema.js';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    @InjectModel(NotificationPreference.name)
    private readonly preferenceModel: Model<NotificationPreferenceDocument>,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    query: NotificationQueryDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);

    const filter: Record<string, unknown> = {
      organizationId,
      userId,
    };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.category) {
      filter.category = query.category;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean()
        .exec(),

      this.notificationModel.countDocuments(filter).exec(),
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

  async getUnreadCount(user: AuthenticatedUser): Promise<{ unreadCount: number }> {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);

    const unreadCount = await this.notificationModel
      .countDocuments({
        organizationId,
        userId,
        isRead: false,
      })
      .exec();

    return { unreadCount };
  }

  async markAsRead(
    user: AuthenticatedUser,
    id: string,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);
    const notificationId = this.toObjectId(id);

    const notification = await this.notificationModel.findOne({
      _id: notificationId,
      organizationId,
      userId,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  async markAllAsRead(
    user: AuthenticatedUser,
  ): Promise<{ modifiedCount: number }> {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);

    const result = await this.notificationModel.updateMany(
      {
        organizationId,
        userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return { modifiedCount: result.modifiedCount };
  }

  async getPreferences(user: AuthenticatedUser) {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);

    const preference = await this.preferenceModel
      .findOne({
        organizationId,
        userId,
      })
      .lean()
      .exec();

    if (!preference) {
      return {
        organizationId,
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        leaveUpdates: true,
        payrollUpdates: true,
        performanceUpdates: true,
        recruitmentUpdates: true,
        announcementUpdates: true,
      };
    }

    return preference;
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);

    const preference = await this.preferenceModel
      .findOneAndUpdate(
        {
          organizationId,
          userId,
        },
        {
          $set: dto,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    return preference;
  }

  async sendNotification(
    organizationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    dto: CreateNotificationDto,
  ) {
    const orgId =
      organizationId instanceof Types.ObjectId
        ? organizationId
        : this.toObjectId(organizationId);
    const uId =
      userId instanceof Types.ObjectId
        ? userId
        : this.toObjectId(userId);

    return this.notificationModel.create({
      organizationId: orgId,
      userId: uId,
      title: dto.title,
      message: dto.message,
      type: dto.type ?? NotificationType.INFO,
      category: dto.category ?? NotificationCategory.SYSTEM,
      link: dto.link,
      metadata: dto.metadata ?? {},
      isRead: false,
    });
  }

  async sendBatchNotification(
    organizationId: string | Types.ObjectId,
    userIds: (string | Types.ObjectId)[],
    dto: CreateNotificationDto,
  ) {
    if (userIds.length === 0) return [];

    const orgId =
      organizationId instanceof Types.ObjectId
        ? organizationId
        : this.toObjectId(organizationId);

    const docs = userIds.map((uId) => ({
      organizationId: orgId,
      userId:
        uId instanceof Types.ObjectId ? uId : this.toObjectId(uId),
      title: dto.title,
      message: dto.message,
      type: dto.type ?? NotificationType.INFO,
      category: dto.category ?? NotificationCategory.SYSTEM,
      link: dto.link,
      metadata: dto.metadata ?? {},
      isRead: false,
    }));

    return this.notificationModel.insertMany(docs);
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
