import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';

import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.interface.js';

import { CreateOrganizationDocumentDto } from './dto/create-organization-document.dto.js';
import { OrganizationDocumentQueryDto } from './dto/organization-document-query.dto.js';
import { UpdateOrganizationDocumentDto } from './dto/update-organization-document.dto.js';
import {
  OrganizationDocument,
  OrganizationDocumentDoc,
  OrganizationDocumentStatus,
} from './schemas/organization-document.schema.js';

export type UploadedDocumentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class OrganizationDocumentsService {
  constructor(
    @InjectModel(OrganizationDocument.name)
    private readonly documentModel: Model<OrganizationDocumentDoc>,

    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateOrganizationDocumentDto,
    file?: UploadedDocumentFile,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const userId = this.toObjectId(user.userId);

    if (!file) {
      throw new BadRequestException('A document file is required');
    }

    this.validateFile(file);

    const extension = this.getFileExtension(file.originalname);

    const storageKey = [
      'organizations',
      user.organizationId,
      'documents',
      `${randomUUID()}${extension}`,
    ].join('/');

    let storedFile = false;

    try {
      await this.storageService.upload({
        key: storageKey,
        body: file.buffer,
        contentType: file.mimetype,
      });

      storedFile = true;

      const document = await this.documentModel.create({
        organizationId,
        title: dto.title.trim(),
        category: dto.category,
        description: dto.description?.trim(),
        version: dto.version?.trim() ?? '1.0',
        tags: dto.tags ?? [],
        originalFileName: file.originalname.trim(),
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
        status: OrganizationDocumentStatus.ACTIVE,
        uploadedBy: userId,
      });

      await this.audit(
        user,
        AuditAction.CREATE,
        document,
        'UPLOAD',
      );

      return document;
    } catch (error) {
      if (storedFile) {
        try {
          await this.storageService.delete(storageKey);
        } catch {
          // Ignore cleanup error to preserve primary error
        }
      }

      throw error;
    }
  }

  async findAll(
    user: AuthenticatedUser,
    query: OrganizationDocumentQueryDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = OrganizationDocumentStatus.ACTIVE;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.search) {
      filter.title = {
        $regex: this.escapeRegex(query.search),
        $options: 'i',
      };
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean()
        .exec(),

      this.documentModel.countDocuments(filter).exec(),
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
    const document = await this.documentModel
      .findOne({
        _id: this.toObjectId(id),
        organizationId: this.toObjectId(user.organizationId),
      })
      .lean()
      .exec();

    if (!document) {
      throw new NotFoundException('Organization document not found');
    }

    return document;
  }

  async download(
    user: AuthenticatedUser,
    id: string,
  ) {
    const document = await this.documentModel.findOne({
      _id: this.toObjectId(id),
      organizationId: this.toObjectId(user.organizationId),
    });

    if (!document) {
      throw new NotFoundException('Organization document not found');
    }

    const file = await this.storageService.get(document.storageKey);

    return {
      body: file.body,
      contentType: document.mimeType,
      fileName: document.originalFileName,
    };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateOrganizationDocumentDto,
  ) {
    const document = await this.getDocumentDocument(
      user.organizationId,
      id,
    );

    if (document.status === OrganizationDocumentStatus.ARCHIVED) {
      throw new ConflictException(
        'An archived document cannot be updated',
      );
    }

    if (dto.title !== undefined) {
      document.title = dto.title.trim();
    }

    if (dto.category !== undefined) {
      document.category = dto.category;
    }

    if (dto.description !== undefined) {
      document.description = dto.description.trim();
    }

    if (dto.version !== undefined) {
      document.version = dto.version.trim();
    }

    if (dto.tags !== undefined) {
      document.tags = dto.tags;
    }

    document.updatedBy = this.toObjectId(user.userId);

    await document.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      document,
      'UPDATE',
    );

    return document;
  }

  async archive(
    user: AuthenticatedUser,
    id: string,
  ) {
    const document = await this.getDocumentDocument(
      user.organizationId,
      id,
    );

    if (document.status === OrganizationDocumentStatus.ARCHIVED) {
      return document;
    }

    document.status = OrganizationDocumentStatus.ARCHIVED;
    document.archivedAt = new Date();
    document.archivedBy = this.toObjectId(user.userId);
    document.updatedBy = this.toObjectId(user.userId);

    await document.save();

    await this.audit(
      user,
      AuditAction.CANCEL,
      document,
      'ARCHIVE',
    );

    return document;
  }

  private async getDocumentDocument(
    organizationId: string,
    documentId: string,
  ): Promise<OrganizationDocumentDoc> {
    const document = await this.documentModel.findOne({
      _id: this.toObjectId(documentId),
      organizationId: this.toObjectId(organizationId),
    });

    if (!document) {
      throw new NotFoundException('Organization document not found');
    }

    return document;
  }

  private validateFile(file: UploadedDocumentFile): void {
    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Allowed types: PDF, JPEG, PNG, WebP, DOCX, XLSX',
      );
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size <= 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    if (file.size > maxFileSize) {
      throw new BadRequestException('File size must not exceed 10 MB');
    }
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
      return '';
    }

    const extension = fileName.slice(lastDotIndex).toLowerCase();

    if (!/^\.[a-z0-9]+$/.test(extension)) {
      return '';
    }

    return extension;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  private async audit(
    user: AuthenticatedUser,
    action: AuditAction,
    document: OrganizationDocumentDoc | { _id: Types.ObjectId },
    lifecycle: string,
  ) {
    await this.auditLogsService.record({
      user,
      action,
      entity: AuditEntity.ORGANIZATION_DOCUMENT,
      entityId: document._id,
      metadata: {
        lifecycle,
      },
    });
  }
}
