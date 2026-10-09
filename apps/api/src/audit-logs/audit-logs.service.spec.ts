import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuditAction,
  AuditEntity,
} from './schemas/audit-log.schema.js';
import { AuditLogsService } from './audit-logs.service.js';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const entityId = '6ac510000000000000000070';

  const user = {
    userId,
    organizationId,
  };

  const auditLogModel = {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new AuditLogsService(auditLogModel as never);
  });

  const auditLogDoc = () => ({
    _id: new Types.ObjectId('6ac510000000000000000080'),
    organizationId: new Types.ObjectId(organizationId),
    actorId: new Types.ObjectId(userId),
    action: AuditAction.CREATE,
    entity: AuditEntity.ORGANIZATION_DOCUMENT,
    entityId: new Types.ObjectId(entityId),
    metadata: { test: true },
    createdAt: new Date(),
  });

  describe('record', () => {
    it('creates an audit log entry scoped by tenant and actor', async () => {
      const doc = auditLogDoc();
      auditLogModel.create.mockResolvedValue(doc);

      const result = await service.record({
        user,
        action: AuditAction.CREATE,
        entity: AuditEntity.ORGANIZATION_DOCUMENT,
        entityId,
        metadata: { test: true },
      });

      expect(result).toEqual(doc);
      expect(auditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          actorId: new Types.ObjectId(userId),
          action: AuditAction.CREATE,
          entity: AuditEntity.ORGANIZATION_DOCUMENT,
          entityId: new Types.ObjectId(entityId),
          metadata: { test: true },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns tenant-scoped audit logs with pagination and filters', async () => {
      const items = [auditLogDoc()];
      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      auditLogModel.find.mockReturnValue(findQuery);
      auditLogModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(
        {
          action: AuditAction.CREATE,
          entity: AuditEntity.ORGANIZATION_DOCUMENT,
          fromDate: '2026-10-01',
          toDate: '2026-10-31',
          page: 1,
          limit: 20,
        },
        user,
      );

      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(auditLogModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          action: AuditAction.CREATE,
          entity: AuditEntity.ORGANIZATION_DOCUMENT,
        }),
      );
    });
  });

  describe('findByEntity', () => {
    it('returns audit logs for specific entity scoped by tenant', async () => {
      const items = [auditLogDoc()];
      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      auditLogModel.find.mockReturnValue(findQuery);

      const result = await service.findByEntity(
        AuditEntity.ORGANIZATION_DOCUMENT,
        entityId,
        user,
      );

      expect(result).toEqual(items);
      expect(auditLogModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(organizationId),
        entity: AuditEntity.ORGANIZATION_DOCUMENT,
        entityId: new Types.ObjectId(entityId),
      });
    });

    it('rejects an invalid entity ID', async () => {
      await expect(
        service.findByEntity(
          AuditEntity.ORGANIZATION_DOCUMENT,
          'invalid-id',
          user,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
