import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Employee } from '../employees/schemas/employee.schema.js';
import {
  EmployeeDocument,
  EmployeeDocumentStatus,
} from './schemas/employee-document.schema.js';
import { CreateEmployeeDocumentDto } from './dto/create-employee-document.dto.js';
import { EmployeeDocumentQueryDto } from './dto/employee-document-query.dto.js';

@Injectable()
export class EmployeeDocumentsService {
  constructor(
    @InjectModel(EmployeeDocument.name)
    private readonly documentModel: Model<EmployeeDocument>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
  ) {}

  async create(
    organizationId: string,
    employeeId: string,
    uploadedBy: string,
    dto: CreateEmployeeDocumentDto,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    try {
      return await this.documentModel.create({
        organizationId: organizationObjectId,
        employeeId: employeeObjectId,
        name: dto.name.trim(),
        type: dto.type,
        description: dto.description?.trim(),
        originalFileName:
          dto.originalFileName?.trim(),
        mimeType: dto.mimeType?.trim(),
        fileSize: dto.fileSize,
        storageKey: dto.storageKey?.trim(),
        storageUrl: dto.storageUrl?.trim(),
        status: EmployeeDocumentStatus.ACTIVE,
        uploadedBy: this.toObjectId(uploadedBy),
      });
    } catch (error) {
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
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

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
    const document =
      await this.documentModel
        .findOne({
          _id: this.toObjectId(documentId),
          organizationId:
            this.toObjectId(organizationId),
          employeeId:
            this.toObjectId(employeeId),
        })
        .lean()
        .exec();

    if (!document) {
      throw new NotFoundException(
        'Employee document not found',
      );
    }

    return document;
  }

  async archive(
    organizationId: string,
    employeeId: string,
    documentId: string,
    archivedBy: string,
  ) {
    const document =
      await this.documentModel
        .findOne({
          _id: this.toObjectId(documentId),
          organizationId:
            this.toObjectId(organizationId),
          employeeId:
            this.toObjectId(employeeId),
        })
        .exec();

    if (!document) {
      throw new NotFoundException(
        'Employee document not found',
      );
    }

    if (
      document.status ===
      EmployeeDocumentStatus.ARCHIVED
    ) {
      return document;
    }

    document.status =
      EmployeeDocumentStatus.ARCHIVED;

    document.archivedAt = new Date();

    document.archivedBy =
      this.toObjectId(archivedBy);

    await document.save();

    return document;
  }

  private async ensureEmployeeBelongsToOrganization(
    organizationId: Types.ObjectId,
    employeeId: Types.ObjectId,
  ) {
    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeId,
          organizationId,
        })
        .select('_id')
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        'Invalid identifier',
      );
    }

    return new Types.ObjectId(value);
  }

  private escapeRegex(value: string): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }

  private isDuplicateKeyError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
