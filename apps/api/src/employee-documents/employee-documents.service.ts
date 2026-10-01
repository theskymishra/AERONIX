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

import { STORAGE_SERVICE } from '../storage/storage.interface.js';
import type { StorageService } from '../storage/storage.interface.js';

import { Employee } from '../employees/schemas/employee.schema.js';

import {
  EmployeeDocument,
  EmployeeDocumentStatus,
} from './schemas/employee-document.schema.js';

import { CreateEmployeeDocumentDto } from './dto/create-employee-document.dto.js';
import { EmployeeDocumentQueryDto } from './dto/employee-document-query.dto.js';

type UploadedDocumentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class EmployeeDocumentsService {
  constructor(
    @InjectModel(EmployeeDocument.name)
    private readonly documentModel: Model<EmployeeDocument>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,

    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {}

  async create(
    organizationId: string,
    employeeId: string,
    uploadedBy: string,
    dto: CreateEmployeeDocumentDto,
    file?: UploadedDocumentFile,
  ) {
    const organizationObjectId = this.toObjectId(organizationId);
    const employeeObjectId = this.toObjectId(employeeId);
    const uploadedByObjectId = this.toObjectId(uploadedBy);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    if (!file) {
      throw new BadRequestException('A document file is required');
    }

    this.validateFile(file);

    const extension = this.getFileExtension(file.originalname);

    const storageKey = [
      'employees',
      employeeId,
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

      return await this.documentModel.create({
        organizationId: organizationObjectId,
        employeeId: employeeObjectId,
        name: dto.name.trim(),
        type: dto.type,
        description: dto.description?.trim(),
        originalFileName: file.originalname.trim(),
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
        status: EmployeeDocumentStatus.ACTIVE,
        uploadedBy: uploadedByObjectId,
      });
    } catch (error) {
      if (storedFile) {
        try {
          await this.storageService.delete(storageKey);
        } catch {
          // Preserve the original error if cleanup also fails.
        }
      }

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'A document with the same identifier already exists',
        );
      }

      throw error;
    }
  }

  async findAll(
    organizationId: string,
    employeeId: string,
    query: EmployeeDocumentQueryDto,
  ) {
    const organizationObjectId = this.toObjectId(organizationId);

    const employeeObjectId = this.toObjectId(employeeId);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId: organizationObjectId,
      employeeId: employeeObjectId,
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      filter.name = {
        $regex: this.escapeRegex(query.search.trim()),
        $options: 'i',
      };
    }

    const [items, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      this.documentModel.countDocuments(filter).exec(),
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
    organizationId: string,
    employeeId: string,
    documentId: string,
  ) {
    const document = await this.documentModel
      .findOne({
        _id: this.toObjectId(documentId),
        organizationId: this.toObjectId(organizationId),
        employeeId: this.toObjectId(employeeId),
      })
      .lean()
      .exec();

    if (!document) {
      throw new NotFoundException('Employee document not found');
    }

    return document;
  }

  async download(
    organizationId: string,
    employeeId: string,
    documentId: string,
  ) {
    const organizationObjectId = this.toObjectId(organizationId);

    const employeeObjectId = this.toObjectId(employeeId);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    const document = await this.documentModel
      .findOne({
        _id: this.toObjectId(documentId),
        organizationId: organizationObjectId,
        employeeId: employeeObjectId,
      })
      .lean()
      .exec();

    if (!document) {
      throw new NotFoundException('Employee document not found');
    }

    if (document.status === EmployeeDocumentStatus.ARCHIVED) {
      throw new NotFoundException('Employee document not found');
    }

    if (!document.storageKey) {
      throw new NotFoundException('Document file not found');
    }

    const storedFile = await this.storageService.get(document.storageKey);

    return {
      body: storedFile.body,
      contentType: document.mimeType ?? 'application/octet-stream',
      fileName: document.originalFileName ?? document.name,
    };
  }

  async archive(
    organizationId: string,
    employeeId: string,
    documentId: string,
    archivedBy: string,
  ) {
    const document = await this.documentModel
      .findOne({
        _id: this.toObjectId(documentId),
        organizationId: this.toObjectId(organizationId),
        employeeId: this.toObjectId(employeeId),
      })
      .exec();

    if (!document) {
      throw new NotFoundException('Employee document not found');
    }

    if (document.status === EmployeeDocumentStatus.ARCHIVED) {
      return document;
    }

    document.status = EmployeeDocumentStatus.ARCHIVED;

    document.archivedAt = new Date();

    document.archivedBy = this.toObjectId(archivedBy);

    await document.save();

    return document;
  }

  private async ensureEmployeeBelongsToOrganization(
    organizationId: Types.ObjectId,
    employeeId: Types.ObjectId,
  ) {
    const employee = await this.employeeModel
      .findOne({
        _id: employeeId,
        organizationId,
      })
      .select('_id')
      .lean()
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
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

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid identifier');
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
