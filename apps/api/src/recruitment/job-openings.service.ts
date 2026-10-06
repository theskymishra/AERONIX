import {
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
import { EmployeeDocument } from '../employees/schemas/employee.schema.js';

import { CreateJobOpeningDto } from './dto/create-job-opening.dto.js';
import { JobOpeningQueryDto } from './dto/job-opening-query.dto.js';
import { UpdateJobOpeningDto } from './dto/update-job-opening.dto.js';
import {
  JobOpening,
  JobOpeningDocument,
  JobOpeningStatus,
} from './schemas/job-opening.schema.js';

type AuthenticatedUser = {
  userId: string;
  organizationId: string;
};

@Injectable()
export class JobOpeningsService {
  constructor(
    @InjectModel(JobOpening.name)
    private readonly jobOpeningModel: Model<JobOpeningDocument>,
    @InjectModel('Employee')
    private readonly employeeModel: Model<EmployeeDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateJobOpeningDto,
    user: AuthenticatedUser,
  ): Promise<JobOpeningDocument> {
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);

    const hiringManager = await this.getEmployee(
      dto.hiringManagerId,
      user.organizationId,
    );

    const jobOpening = await this.jobOpeningModel.create({
      organizationId: new Types.ObjectId(user.organizationId),
      title: dto.title,
      department: dto.department,
      team: dto.team,
      hiringManagerId: hiringManager._id,
      employmentType: dto.employmentType,
      workMode: dto.workMode,
      location: dto.location,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryCurrency: dto.salaryCurrency,
      description: dto.description,
      requirements: dto.requirements,
      requiredSkills: dto.requiredSkills ?? [],
      status: JobOpeningStatus.DRAFT,
      notes: dto.notes,
      createdBy: new Types.ObjectId(user.userId),
    });

    await this.auditLogsService.record({
      user,
      action: AuditAction.CREATE,
      entity: AuditEntity.JOB_OPENING,
      entityId: jobOpening._id,
      metadata: {
        title: jobOpening.title,
        hiringManagerId: jobOpening.hiringManagerId.toString(),
      },
    });

    return jobOpening;
  }

  async findAll(
    query: JobOpeningQueryDto,
    user: AuthenticatedUser,
  ) {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(user.organizationId),
    };

    if (query.department) {
      filter.department = query.department;
    }

    if (query.team) {
      filter.team = query.team;
    }

    if (query.hiringManagerId) {
      filter.hiringManagerId = this.toObjectId(query.hiringManagerId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.employmentType) {
      filter.employmentType = query.employmentType;
    }

    if (query.workMode) {
      filter.workMode = query.workMode;
    }

    if (query.location) {
      filter.location = {
        $regex: query.location,
        $options: 'i',
      };
    }

    if (query.skill) {
      filter.requiredSkills = {
        $regex: query.skill,
        $options: 'i',
      };
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { requirements: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.jobOpeningModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.jobOpeningModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<JobOpeningDocument> {
    return this.getJobOpening(id, user.organizationId);
  }

  async update(
    id: string,
    dto: UpdateJobOpeningDto,
    user: AuthenticatedUser,
  ): Promise<JobOpeningDocument> {
    const jobOpening = await this.getJobOpening(
      id,
      user.organizationId,
    );

    if (
      jobOpening.status === JobOpeningStatus.CLOSED ||
      jobOpening.status === JobOpeningStatus.ARCHIVED
    ) {
      throw new ConflictException(
        'Closed or archived job openings cannot be updated',
      );
    }

    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);

    if (dto.hiringManagerId) {
      const hiringManager = await this.getEmployee(
        dto.hiringManagerId,
        user.organizationId,
      );

      jobOpening.hiringManagerId = hiringManager._id;
    }

    const previous = {
      title: jobOpening.title,
      department: jobOpening.department,
      team: jobOpening.team,
      employmentType: jobOpening.employmentType,
      workMode: jobOpening.workMode,
      location: jobOpening.location,
      salaryMin: jobOpening.salaryMin,
      salaryMax: jobOpening.salaryMax,
      requiredSkills: jobOpening.requiredSkills,
      status: jobOpening.status,
    };

    const {
      hiringManagerId: _hiringManagerId,
      ...updates
    } = dto;

    Object.assign(jobOpening, updates);

    jobOpening.updatedBy = new Types.ObjectId(user.userId);

    await jobOpening.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.JOB_OPENING,
      entityId: jobOpening._id,
      metadata: {
        previous,
        changes: dto,
      },
    });

    return jobOpening;
  }

  async publish(
    id: string,
    user: AuthenticatedUser,
  ): Promise<JobOpeningDocument> {
    const jobOpening = await this.getJobOpening(
      id,
      user.organizationId,
    );

    if (jobOpening.status !== JobOpeningStatus.DRAFT) {
      throw new ConflictException(
        'Only draft job openings can be published',
      );
    }

    jobOpening.status = JobOpeningStatus.PUBLISHED;
    jobOpening.publishedAt = new Date();
    jobOpening.updatedBy = new Types.ObjectId(user.userId);

    await jobOpening.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.JOB_OPENING,
      entityId: jobOpening._id,
      metadata: {
        action: 'PUBLISHED',
      },
    });

    return jobOpening;
  }

  async close(
    id: string,
    user: AuthenticatedUser,
  ): Promise<JobOpeningDocument> {
    const jobOpening = await this.getJobOpening(
      id,
      user.organizationId,
    );

    if (jobOpening.status !== JobOpeningStatus.PUBLISHED) {
      throw new ConflictException(
        'Only published job openings can be closed',
      );
    }

    jobOpening.status = JobOpeningStatus.CLOSED;
    jobOpening.closedAt = new Date();
    jobOpening.closedBy = new Types.ObjectId(user.userId);
    jobOpening.updatedBy = new Types.ObjectId(user.userId);

    await jobOpening.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.JOB_OPENING,
      entityId: jobOpening._id,
      metadata: {
        action: 'CLOSED',
      },
    });

    return jobOpening;
  }

  async archive(
    id: string,
    user: AuthenticatedUser,
  ): Promise<JobOpeningDocument> {
    const jobOpening = await this.getJobOpening(
      id,
      user.organizationId,
    );

    if (
      jobOpening.status !== JobOpeningStatus.DRAFT &&
      jobOpening.status !== JobOpeningStatus.PUBLISHED
    ) {
      throw new ConflictException(
        'Only draft or published job openings can be archived',
      );
    }

    jobOpening.status = JobOpeningStatus.ARCHIVED;
    jobOpening.updatedBy = new Types.ObjectId(user.userId);

    await jobOpening.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.JOB_OPENING,
      entityId: jobOpening._id,
      metadata: {
        action: 'ARCHIVED',
      },
    });

    return jobOpening;
  }

  private async getJobOpening(
    id: string,
    organizationId: string,
  ): Promise<JobOpeningDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Job opening not found');
    }

    const jobOpening = await this.jobOpeningModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!jobOpening) {
      throw new NotFoundException('Job opening not found');
    }

    return jobOpening;
  }

  private async getEmployee(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeDocument> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new NotFoundException('Employee not found');
    }

    const employee = await this.employeeModel.findOne({
      _id: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      employmentStatus: 'ACTIVE',
    });

    if (!employee) {
      throw new NotFoundException(
        'Hiring manager must be an active employee in the organization',
      );
    }

    return employee;
  }

  private validateSalaryRange(
    salaryMin?: number,
    salaryMax?: number,
  ): void {
    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      throw new ConflictException(
        'salaryMin cannot be greater than salaryMax',
      );
    }
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException('Invalid identifier');
    }

    return new Types.ObjectId(value);
  }
}