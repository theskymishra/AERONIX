import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuditAction, AuditEntity } from '../../audit-logs/schemas/audit-log.schema.js';
import { AuditLogsService } from '../../audit-logs/audit-logs.service.js';

import {
  Candidate,
  CandidateDocument,
} from '../candidates/schemas/candidate.schema.js';

import {
  JobOpening,
  JobOpeningDocument,
  JobOpeningStatus,
} from '../schemas/job-opening.schema.js';

import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
} from './schemas/application.schema.js';

import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { ApplicationQueryDto } from './dto/application-query.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,

    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,

    @InjectModel(JobOpening.name)
    private readonly jobOpeningModel: Model<JobOpeningDocument>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    jobOpeningId: string,
    dto: CreateApplicationDto,
    user: any,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const candidateId = this.toObjectId(dto.candidateId);
    const openingId = this.toObjectId(jobOpeningId);

    const candidate = await this.candidateModel.findOne({
      _id: candidateId,
      organizationId,
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const jobOpening = await this.jobOpeningModel.findOne({
      _id: openingId,
      organizationId,
    });

    if (!jobOpening) {
      throw new NotFoundException('Job opening not found');
    }

    if (
      jobOpening.status === JobOpeningStatus.CLOSED ||
      jobOpening.status === JobOpeningStatus.ARCHIVED
    ) {
      throw new ConflictException(
        'Applications cannot be created for a closed or archived job opening',
      );
    }

    const existingApplication = await this.applicationModel.findOne({
      organizationId,
      jobOpeningId: openingId,
      candidateId,
    });

    if (existingApplication) {
      throw new ConflictException(
        'Candidate has already applied to this job opening',
      );
    }

    const application = await this.applicationModel.create({
      organizationId,
      jobOpeningId: openingId,
      candidateId,
      status: ApplicationStatus.APPLIED,
      coverLetter: dto.coverLetter,
      source: dto.source,
      notes: dto.notes,
      appliedAt: new Date(),
      createdBy: this.toObjectId(user.userId),
    });

    await this.auditLogsService.record({
      user,
      action: AuditAction.CREATE,
      entity: AuditEntity.APPLICATION,
      entityId: application._id.toString(),
    });

    return application;
  }

  async findAll(query: ApplicationQueryDto, user: any) {
    const organizationId = this.toObjectId(user.organizationId);

    const filter: Record<string, any> = {
      organizationId,
    };

    if (query.candidateId) {
      filter.candidateId = this.toObjectId(query.candidateId);
    }

    if (query.jobOpeningId) {
      filter.jobOpeningId = this.toObjectId(query.jobOpeningId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),

      this.applicationModel.countDocuments(filter),
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

  async findOne(id: string, user: any) {
    const organizationId = this.toObjectId(user.organizationId);
    const applicationId = this.toObjectId(id);

    const application = await this.applicationModel.findOne({
      _id: applicationId,
      organizationId,
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async update(
    id: string,
    dto: UpdateApplicationDto,
    user: any,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const applicationId = this.toObjectId(id);

    const application = await this.applicationModel.findOne({
      _id: applicationId,
      organizationId,
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (
      application.status === ApplicationStatus.HIRED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      throw new ConflictException(
        'A completed application cannot be updated',
      );
    }

    if (dto.candidateId) {
      const candidateId = this.toObjectId(dto.candidateId);

      const candidate = await this.candidateModel.findOne({
        _id: candidateId,
        organizationId,
      });

      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      const duplicate = await this.applicationModel.findOne({
        organizationId,
        jobOpeningId: application.jobOpeningId,
        candidateId,
        _id: { $ne: application._id },
      });

      if (duplicate) {
        throw new ConflictException(
          'Candidate has already applied to this job opening',
        );
      }

      application.candidateId = candidateId;
    }

    if (dto.coverLetter !== undefined) {
      application.coverLetter = dto.coverLetter;
    }

    if (dto.source !== undefined) {
      application.source = dto.source;
    }

    if (dto.notes !== undefined) {
      application.notes = dto.notes;
    }

    application.updatedBy = this.toObjectId(user.userId);

    await application.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.APPLICATION,
      entityId: application._id.toString(),
    });

    return application;
  }

  async screen(id: string, user: any) {
    return this.transition(
      id,
      user,
      ApplicationStatus.APPLIED,
      ApplicationStatus.SCREENING,
      {
        screenedAt: new Date(),
        screenedBy: this.toObjectId(user.userId),
      },
    );
  }

  async shortlist(id: string, user: any) {
    return this.transition(
      id,
      user,
      ApplicationStatus.SCREENING,
      ApplicationStatus.SHORTLISTED,
      {
        shortlistedAt: new Date(),
      },
    );
  }

  async interview(id: string, user: any) {
    return this.transition(
      id,
      user,
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.INTERVIEW,
    );
  }

  async offer(id: string, user: any) {
    return this.transition(
      id,
      user,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.OFFERED,
    );
  }

  async hire(id: string, user: any) {
    return this.transition(
      id,
      user,
      ApplicationStatus.OFFERED,
      ApplicationStatus.HIRED,
    );
  }

  async reject(
    id: string,
    reason: string | undefined,
    user: any,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const applicationId = this.toObjectId(id);

    const application = await this.applicationModel.findOne({
      _id: applicationId,
      organizationId,
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const rejectableStatuses = [
      ApplicationStatus.APPLIED,
      ApplicationStatus.SCREENING,
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.OFFERED,
    ];

    if (!rejectableStatuses.includes(application.status)) {
      throw new ConflictException(
        `Application cannot be rejected from ${application.status} status`,
      );
    }

    application.status = ApplicationStatus.REJECTED;
    application.rejectedAt = new Date();
    application.rejectedBy = this.toObjectId(user.userId);
    application.rejectionReason = reason?.trim();

    application.updatedBy = this.toObjectId(user.userId);

    await application.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.APPLICATION,
      entityId: application._id.toString(),
    });

    return application;
  }

  private async transition(
    id: string,
    user: any,
    from: ApplicationStatus,
    to: ApplicationStatus,
    updates: Partial<Application> = {},
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const applicationId = this.toObjectId(id);

    const application = await this.applicationModel.findOne({
      _id: applicationId,
      organizationId,
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== from) {
      throw new ConflictException(
        `Application must be in ${from} status to move to ${to}`,
      );
    }

    application.status = to;

    Object.assign(application, updates);

    application.updatedBy = this.toObjectId(user.userId);

    await application.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.APPLICATION,
      entityId: application._id.toString(),
    });

    return application;
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ID');
    }

    return new Types.ObjectId(value);
  }
}