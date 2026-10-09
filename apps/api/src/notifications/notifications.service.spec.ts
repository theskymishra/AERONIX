import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NotificationCategory,
  NotificationType,
} from './schemas/notification.schema.js';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const otherUserId = '6aa522bc5145273578dcdc74';
  const notificationId = '6ac510000000000000000030';

  const user = {
    userId,
    organizationId,
  };

  const notificationModel = {
    create: vi.fn(),
    insertMany: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    updateMany: vi.fn(),
  };

  const preferenceModel = {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new NotificationsService(
      notificationModel as never,
      preferenceModel as never,
    );
  });

  const notificationDoc = (isRead = false) => ({
    _id: new Types.ObjectId(notificationId),
    organizationId: new Types.ObjectId(organizationId),
    userId: new Types.ObjectId(userId),
    title: 'Leave Approved',
    message: 'Your leave request has been approved.',
    type: NotificationType.SUCCESS,
    category: NotificationCategory.LEAVE,
    isRead,
    readAt: isRead ? new Date() : undefined,
    save: vi.fn().mockResolvedValue(undefined),
  });

  describe('findAll', () => {
    it('returns tenant and user scoped notifications with pagination', async () => {
      const items = [notificationDoc()];
      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      notificationModel.find.mockReturnValue(findQuery);
      notificationModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(user, {
        isRead: false,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.LEAVE,
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual(items);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });

      expect(notificationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
          isRead: false,
          type: NotificationType.SUCCESS,
          category: NotificationCategory.LEAVE,
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications for current user', async () => {
      notificationModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(5),
      });

      const result = await service.getUnreadCount(user);

      expect(result).toEqual({ unreadCount: 5 });
      expect(notificationModel.countDocuments).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(organizationId),
        userId: new Types.ObjectId(userId),
        isRead: false,
      });
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      const item = notificationDoc(false);
      notificationModel.findOne.mockResolvedValue(item);

      const result = await service.markAsRead(user, notificationId);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
      expect(item.save).toHaveBeenCalled();
    });

    it('rejects notification not found or belonging to another user', async () => {
      notificationModel.findOne.mockResolvedValue(null);

      await expect(
        service.markAsRead(user, notificationId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an invalid ID', async () => {
      await expect(
        service.markAsRead(user, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read for current user', async () => {
      notificationModel.updateMany.mockResolvedValue({
        modifiedCount: 3,
      });

      const result = await service.markAllAsRead(user);

      expect(result).toEqual({ modifiedCount: 3 });
      expect(notificationModel.updateMany).toHaveBeenCalledWith(
        {
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
          isRead: false,
        },
        expect.objectContaining({
          $set: expect.objectContaining({ isRead: true }),
        }),
      );
    });
  });

  describe('getPreferences', () => {
    it('returns user preferences when set', async () => {
      const prefs = {
        organizationId: new Types.ObjectId(organizationId),
        userId: new Types.ObjectId(userId),
        emailNotifications: false,
        inAppNotifications: true,
      };

      preferenceModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(prefs),
      });

      const result = await service.getPreferences(user);
      expect(result).toEqual(prefs);
    });

    it('returns default preferences when not found', async () => {
      preferenceModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await service.getPreferences(user);
      expect(result.inAppNotifications).toBe(true);
      expect(result.emailNotifications).toBe(true);
    });
  });

  describe('updatePreferences', () => {
    it('upserts notification preferences', async () => {
      const updated = {
        organizationId: new Types.ObjectId(organizationId),
        userId: new Types.ObjectId(userId),
        emailNotifications: false,
      };

      preferenceModel.findOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(updated),
      });

      const result = await service.updatePreferences(user, {
        emailNotifications: false,
      });

      expect(result).toEqual(updated);
      expect(preferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
        },
        {
          $set: { emailNotifications: false },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    });
  });

  describe('sendNotification and sendBatchNotification', () => {
    it('creates a single notification', async () => {
      const created = notificationDoc();
      notificationModel.create.mockResolvedValue(created);

      const result = await service.sendNotification(
        organizationId,
        userId,
        {
          title: 'Test',
          message: 'Test message',
        },
      );

      expect(result).toEqual(created);
      expect(notificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
          title: 'Test',
          message: 'Test message',
          isRead: false,
        }),
      );
    });

    it('creates batch notifications', async () => {
      notificationModel.insertMany.mockResolvedValue([notificationDoc()]);

      const result = await service.sendBatchNotification(
        organizationId,
        [userId, otherUserId],
        {
          title: 'Batch',
          message: 'Batch message',
        },
      );

      expect(result).toHaveLength(1);

      expect(notificationModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: new Types.ObjectId(userId),
          }),
          expect.objectContaining({
            userId: new Types.ObjectId(otherUserId),
          }),
        ]),
      );
    });
  });
});
