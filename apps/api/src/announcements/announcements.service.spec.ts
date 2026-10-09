import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import {
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetAudience,
} from './schemas/announcement.schema.js';
import { AnnouncementsService } from './announcements.service.js';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const announcementId = '6ac510000000000000000010';
  const departmentId = '6ac510000000000000000020';

  const user = {
    userId,
    organizationId,
  };

  const announcementModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  };

  const employeeModel = {
    findOne: vi.fn(),
    find: vi.fn(),
  };

  const rolesService = {
    getUserPermissions: vi.fn(),
  };

  const notificationsService = {
    sendBatchNotification: vi.fn().mockResolvedValue([]),
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new AnnouncementsService(
      announcementModel as never,
      employeeModel as never,
      rolesService as never,
      notificationsService as never,
      auditLogsService as never,
    );
  });

  const announcementDoc = (
    status: AnnouncementStatus = AnnouncementStatus.DRAFT,
  ) => ({
    _id: new Types.ObjectId(announcementId),
    organizationId: new Types.ObjectId(organizationId),
    title: 'Company All Hands',
    content: 'All hands meeting scheduled for Friday.',
    status,
    priority: AnnouncementPriority.NORMAL,
    targetAudience: AnnouncementTargetAudience.ALL,
    targetDepartmentIds: [] as Types.ObjectId[],
    targetRoles: [] as string[],
    publishedAt: undefined as Date | undefined,
    publishedBy: undefined as Types.ObjectId | undefined,
    archivedAt: undefined as Date | undefined,
    archivedBy: undefined as Types.ObjectId | undefined,
    createdBy: new Types.ObjectId(userId),
    updatedBy: undefined as Types.ObjectId | undefined,
    save: vi.fn().mockResolvedValue(undefined),
  });

  describe('create', () => {
    it('creates a draft announcement and records audit log', async () => {
      const created = announcementDoc(AnnouncementStatus.DRAFT);
      announcementModel.create.mockResolvedValue(created);

      const result = await service.create(user, {
        title: 'Company All Hands',
        content: 'All hands meeting scheduled for Friday.',
        priority: AnnouncementPriority.HIGH,
        targetAudience: AnnouncementTargetAudience.ALL,
      });

      expect(result).toEqual(created);
      expect(announcementModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          title: 'Company All Hands',
          status: AnnouncementStatus.DRAFT,
          priority: AnnouncementPriority.HIGH,
          createdBy: new Types.ObjectId(userId),
        }),
      );
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          entity: AuditEntity.ANNOUNCEMENT,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns tenant-scoped announcements with pagination for managers', async () => {
      rolesService.getUserPermissions.mockResolvedValue([
        PERMISSIONS.ANNOUNCEMENT_MANAGE,
      ]);

      const items = [announcementDoc(AnnouncementStatus.DRAFT)];
      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      announcementModel.find.mockReturnValue(findQuery);
      announcementModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(user, {
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
      expect(announcementModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
        }),
      );
    });

    it('filters only published announcements for non-manager employees', async () => {
      rolesService.getUserPermissions.mockResolvedValue([
        PERMISSIONS.ANNOUNCEMENT_READ,
      ]);

      const empQuery = {
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          departmentId: new Types.ObjectId(departmentId),
        }),
      };
      employeeModel.findOne.mockReturnValue(empQuery);

      const items = [announcementDoc(AnnouncementStatus.PUBLISHED)];
      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      announcementModel.find.mockReturnValue(findQuery);
      announcementModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(user, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(items);
      expect(announcementModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          status: AnnouncementStatus.PUBLISHED,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns announcement belonging to organization', async () => {
      const item = announcementDoc(AnnouncementStatus.PUBLISHED);
      announcementModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(item),
      });

      const result = await service.findOne(user, announcementId);
      expect(result).toEqual(item);
    });

    it('rejects announcement from another organization', async () => {
      announcementModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne(user, announcementId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects draft announcement for non-manager users', async () => {
      const draft = announcementDoc(AnnouncementStatus.DRAFT);
      announcementModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(draft),
      });

      rolesService.getUserPermissions.mockResolvedValue([
        PERMISSIONS.ANNOUNCEMENT_READ,
      ]);

      await expect(
        service.findOne(user, announcementId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an invalid announcement ID', async () => {
      await expect(
        service.findOne(user, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates announcement and records audit log', async () => {
      const item = announcementDoc(AnnouncementStatus.DRAFT);
      announcementModel.findOne.mockResolvedValue(item);

      const result = await service.update(user, announcementId, {
        title: 'Updated All Hands',
        priority: AnnouncementPriority.URGENT,
      });

      expect(result.title).toBe('Updated All Hands');
      expect(result.priority).toBe(AnnouncementPriority.URGENT);
      expect(item.save).toHaveBeenCalled();
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entity: AuditEntity.ANNOUNCEMENT,
        }),
      );
    });

    it('rejects update for archived announcement', async () => {
      announcementModel.findOne.mockResolvedValue(
        announcementDoc(AnnouncementStatus.ARCHIVED),
      );

      await expect(
        service.update(user, announcementId, { title: 'New' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('publish', () => {
    it('publishes draft announcement, audits, and dispatches notifications', async () => {
      const item = announcementDoc(AnnouncementStatus.DRAFT);
      announcementModel.findOne.mockResolvedValue(item);

      employeeModel.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          { userId: new Types.ObjectId('6ac510000000000000000099') },
        ]),
      });

      const result = await service.publish(user, announcementId);

      expect(result.status).toBe(AnnouncementStatus.PUBLISHED);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(result.publishedBy).toEqual(new Types.ObjectId(userId));
      expect(item.save).toHaveBeenCalled();
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.APPROVE,
          entity: AuditEntity.ANNOUNCEMENT,
        }),
      );
      expect(notificationsService.sendBatchNotification).toHaveBeenCalled();
    });

    it('rejects publishing non-draft announcement', async () => {
      announcementModel.findOne.mockResolvedValue(
        announcementDoc(AnnouncementStatus.PUBLISHED),
      );

      await expect(
        service.publish(user, announcementId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('archive', () => {
    it('archives published announcement and records audit log', async () => {
      const item = announcementDoc(AnnouncementStatus.PUBLISHED);
      announcementModel.findOne.mockResolvedValue(item);

      const result = await service.archive(user, announcementId);

      expect(result.status).toBe(AnnouncementStatus.ARCHIVED);
      expect(result.archivedAt).toBeInstanceOf(Date);
      expect(result.archivedBy).toEqual(new Types.ObjectId(userId));
      expect(item.save).toHaveBeenCalled();
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CANCEL,
          entity: AuditEntity.ANNOUNCEMENT,
        }),
      );
    });

    it('rejects archiving draft announcement', async () => {
      announcementModel.findOne.mockResolvedValue(
        announcementDoc(AnnouncementStatus.DRAFT),
      );

      await expect(
        service.archive(user, announcementId),
      ).rejects.toThrow(ConflictException);
    });
  });
});
