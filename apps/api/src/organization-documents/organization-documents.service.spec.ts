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

import {
  OrganizationDocumentCategory,
  OrganizationDocumentStatus,
} from './schemas/organization-document.schema.js';
import {
  OrganizationDocumentsService,
  type UploadedDocumentFile,
} from './organization-documents.service.js';

describe('OrganizationDocumentsService', () => {
  let service: OrganizationDocumentsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const documentId = '6ac510000000000000000050';

  const user = {
    userId,
    organizationId,
  };

  const documentModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  };

  const storageService = {
    upload: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new OrganizationDocumentsService(
      documentModel as never,
      storageService as never,
      auditLogsService as never,
    );
  });

  const validFile: UploadedDocumentFile = {
    originalname: 'handbook.pdf',
    mimetype: 'application/pdf',
    size: 1024 * 50,
    buffer: Buffer.from('mock pdf content'),
  };

  const documentDoc = (
    status: OrganizationDocumentStatus = OrganizationDocumentStatus.ACTIVE,
  ) => ({
    _id: new Types.ObjectId(documentId),
    organizationId: new Types.ObjectId(organizationId),
    title: 'Employee Handbook',
    category: OrganizationDocumentCategory.HANDBOOK,
    description: 'Updated 2026 policies',
    version: '2.0',
    tags: ['hr', 'policy'],
    originalFileName: 'handbook.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 50,
    storageKey: `organizations/${organizationId}/documents/uuid.pdf`,
    status,
    archivedAt: undefined as Date | undefined,
    archivedBy: undefined as Types.ObjectId | undefined,
    uploadedBy: new Types.ObjectId(userId),
    updatedBy: undefined as Types.ObjectId | undefined,
    save: vi.fn().mockResolvedValue(undefined),
  });

  describe('create', () => {
    it('uploads file, stores document metadata, and records audit log', async () => {
      const created = documentDoc();
      documentModel.create.mockResolvedValue(created);

      const result = await service.create(
        user,
        {
          title: 'Employee Handbook',
          category: OrganizationDocumentCategory.HANDBOOK,
          description: 'Updated 2026 policies',
          version: '2.0',
          tags: ['hr', 'policy'],
        },
        validFile,
      );

      expect(result).toEqual(created);
      expect(storageService.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'application/pdf',
          body: validFile.buffer,
        }),
      );
      expect(documentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          title: 'Employee Handbook',
          category: OrganizationDocumentCategory.HANDBOOK,
          status: OrganizationDocumentStatus.ACTIVE,
          uploadedBy: new Types.ObjectId(userId),
        }),
      );
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          entity: AuditEntity.ORGANIZATION_DOCUMENT,
        }),
      );
    });

    it('rejects creation when file is missing', async () => {
      await expect(
        service.create(
          user,
          {
            title: 'Handbook',
            category: OrganizationDocumentCategory.HANDBOOK,
          },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(storageService.upload).not.toHaveBeenCalled();
      expect(documentModel.create).not.toHaveBeenCalled();
    });

    it('rejects unsupported file type', async () => {
      const invalidFile: UploadedDocumentFile = {
        originalname: 'script.sh',
        mimetype: 'application/x-sh',
        size: 500,
        buffer: Buffer.from('echo hello'),
      };

      await expect(
        service.create(
          user,
          {
            title: 'Script',
            category: OrganizationDocumentCategory.OTHER,
          },
          invalidFile,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('rejects file larger than 10 MB', async () => {
      const tooLargeFile: UploadedDocumentFile = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024,
        buffer: Buffer.alloc(100),
      };

      await expect(
        service.create(
          user,
          {
            title: 'Large Document',
            category: OrganizationDocumentCategory.POLICY,
          },
          tooLargeFile,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('cleans up stored file when database insert fails', async () => {
      documentModel.create.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.create(
          user,
          {
            title: 'Handbook',
            category: OrganizationDocumentCategory.HANDBOOK,
          },
          validFile,
        ),
      ).rejects.toThrow('DB failure');

      expect(storageService.delete).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns tenant-scoped documents with pagination', async () => {
      const items = [documentDoc()];
      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      documentModel.find.mockReturnValue(findQuery);
      documentModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(user, {
        category: OrganizationDocumentCategory.HANDBOOK,
        search: 'Handbook',
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

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          category: OrganizationDocumentCategory.HANDBOOK,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns document belonging to organization', async () => {
      const item = documentDoc();
      documentModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(item),
      });

      const result = await service.findOne(user, documentId);
      expect(result).toEqual(item);
    });

    it('rejects document belonging to another organization', async () => {
      documentModel.findOne.mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne(user, documentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an invalid document ID', async () => {
      await expect(
        service.findOne(user, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('download', () => {
    it('downloads document from storage service', async () => {
      const item = documentDoc();
      documentModel.findOne.mockResolvedValue(item);

      storageService.get.mockResolvedValue({
        body: Buffer.from('mock pdf body'),
      });

      const result = await service.download(user, documentId);

      expect(result.fileName).toBe('handbook.pdf');
      expect(result.contentType).toBe('application/pdf');
      expect(result.body).toEqual(Buffer.from('mock pdf body'));
      expect(storageService.get).toHaveBeenCalledWith(item.storageKey);
    });

    it('rejects download when document is not found', async () => {
      documentModel.findOne.mockResolvedValue(null);

      await expect(
        service.download(user, documentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates document metadata and records audit log', async () => {
      const item = documentDoc();
      documentModel.findOne.mockResolvedValue(item);

      const result = await service.update(user, documentId, {
        title: 'Updated Handbook',
        version: '2.1',
      });

      expect(result.title).toBe('Updated Handbook');
      expect(result.version).toBe('2.1');
      expect(item.save).toHaveBeenCalled();
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entity: AuditEntity.ORGANIZATION_DOCUMENT,
        }),
      );
    });

    it('rejects update for archived document', async () => {
      documentModel.findOne.mockResolvedValue(
        documentDoc(OrganizationDocumentStatus.ARCHIVED),
      );

      await expect(
        service.update(user, documentId, { title: 'New' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('archive', () => {
    it('archives document and records audit log', async () => {
      const item = documentDoc();
      documentModel.findOne.mockResolvedValue(item);

      const result = await service.archive(user, documentId);

      expect(result.status).toBe(OrganizationDocumentStatus.ARCHIVED);
      expect(result.archivedAt).toBeInstanceOf(Date);
      expect(result.archivedBy).toEqual(new Types.ObjectId(userId));
      expect(item.save).toHaveBeenCalled();
      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CANCEL,
          entity: AuditEntity.ORGANIZATION_DOCUMENT,
        }),
      );
    });

    it('returns existing document if already archived', async () => {
      const archived = documentDoc(OrganizationDocumentStatus.ARCHIVED);
      documentModel.findOne.mockResolvedValue(archived);

      const result = await service.archive(user, documentId);

      expect(result.status).toBe(OrganizationDocumentStatus.ARCHIVED);
      expect(archived.save).not.toHaveBeenCalled();
    });
  });
});
