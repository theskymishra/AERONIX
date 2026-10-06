import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';

import {
  EmploymentType,
  JobOpeningStatus,
  WorkMode,
} from './schemas/job-opening.schema.js';
import { JobOpeningsService } from './job-openings.service.js';

describe('JobOpeningsService', () => {
  let service: JobOpeningsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const employeeId = '6abf3bf5891cc9e977636a6f';
  const jobId = '6ac50ef2f9c6c82bbc78c45e';

  const user = {
    userId,
    organizationId,
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  const jobOpeningModel = {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
  };

  const employeeModel = {
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new JobOpeningsService(
      jobOpeningModel as never,
      employeeModel as never,
      auditLogsService as never,
    );
  });

  const createDto = {
    title: 'Senior Software Engineer',
    department: 'Engineering',
    team: 'Platform',
    hiringManagerId: employeeId,
    employmentType: EmploymentType.FULL_TIME,
    workMode: WorkMode.HYBRID,
    location: 'Bengaluru',
    salaryMin: 1200000,
    salaryMax: 1800000,
    salaryCurrency: 'INR',
    description: 'Build scalable workforce intelligence services.',
    requirements: 'Strong TypeScript, Node.js and MongoDB experience.',
    requiredSkills: ['TypeScript', 'Node.js', 'MongoDB'],
    notes: 'Test job opening',
  };

  it('creates a draft job opening for an active hiring manager', async () => {
    const employee = {
      _id: new Types.ObjectId(employeeId),
    };

    const createdJob = {
      _id: new Types.ObjectId(jobId),
      ...createDto,
      organizationId: new Types.ObjectId(organizationId),
      hiringManagerId: employee._id,
      status: JobOpeningStatus.DRAFT,
    };

    employeeModel.findOne.mockResolvedValue(employee);
    jobOpeningModel.create.mockResolvedValue(createdJob);

    const result = await service.create(createDto, user);

    expect(result.status).toBe(JobOpeningStatus.DRAFT);

    expect(employeeModel.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      employmentStatus: 'ACTIVE',
    });

    expect(jobOpeningModel.create).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        action: AuditAction.CREATE,
        entity: AuditEntity.JOB_OPENING,
      }),
    );
  });

  it('rejects a salary range where minimum exceeds maximum', async () => {
    await expect(
      service.create(
        {
          ...createDto,
          salaryMin: 1800000,
          salaryMax: 1200000,
        },
        user,
      ),
    ).rejects.toThrow(ConflictException);

    expect(employeeModel.findOne).not.toHaveBeenCalled();
    expect(jobOpeningModel.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive or missing hiring manager', async () => {
    employeeModel.findOne.mockResolvedValue(null);

    await expect(
      service.create(createDto, user),
    ).rejects.toThrow(NotFoundException);

    expect(jobOpeningModel.create).not.toHaveBeenCalled();
  });

  it('lists job openings with tenant-scoped filtering and pagination', async () => {
    const items = [
      {
        _id: new Types.ObjectId(jobId),
        title: 'Senior Software Engineer',
        status: JobOpeningStatus.DRAFT,
      },
    ];

    const query = {
      department: 'Engineering',
      status: JobOpeningStatus.DRAFT,
      search: 'Senior',
      page: 1,
      limit: 20,
    };

    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(items),
    };

    jobOpeningModel.find.mockReturnValue(findQuery);
    jobOpeningModel.countDocuments.mockResolvedValue(1);

    const result = await service.findAll(query, user);

    expect(result.items).toEqual(items);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    });

    expect(jobOpeningModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: new Types.ObjectId(organizationId),
        department: 'Engineering',
        status: JobOpeningStatus.DRAFT,
        $or: [
          { title: { $regex: 'Senior', $options: 'i' } },
          { description: { $regex: 'Senior', $options: 'i' } },
          { requirements: { $regex: 'Senior', $options: 'i' } },
        ],
      }),
    );
  });

  it('updates a draft job opening', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const jobOpening = {
      _id: new Types.ObjectId(jobId),
      title: 'Senior Software Engineer',
      department: 'Engineering',
      team: 'Platform',
      employmentType: EmploymentType.FULL_TIME,
      workMode: WorkMode.HYBRID,
      location: 'Bengaluru',
      salaryMin: 1200000,
      salaryMax: 1800000,
      requiredSkills: ['TypeScript'],
      status: JobOpeningStatus.DRAFT,
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    jobOpeningModel.findOne.mockResolvedValue(jobOpening);

    const result = await service.update(
      jobId,
      {
        title: 'Lead Software Engineer',
      },
      user,
    );

    expect(result.title).toBe('Lead Software Engineer');
    expect(jobOpening.updatedBy).toEqual(new Types.ObjectId(userId));
    expect(save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.JOB_OPENING,
      }),
    );
  });

  it('rejects updates to closed job openings', async () => {
    jobOpeningModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.CLOSED,
    });

    await expect(
      service.update(
        jobId,
        { title: 'Updated Title' },
        user,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('publishes a draft job opening', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const jobOpening = {
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.DRAFT,
      publishedAt: undefined as Date | undefined,
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    jobOpeningModel.findOne.mockResolvedValue(jobOpening);

    const result = await service.publish(jobId, user);

    expect(result.status).toBe(JobOpeningStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(result.updatedBy).toEqual(new Types.ObjectId(userId));
    expect(save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.JOB_OPENING,
        metadata: { action: 'PUBLISHED' },
      }),
    );
  });

  it('rejects publishing a non-draft job opening', async () => {
    jobOpeningModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.PUBLISHED,
    });

    await expect(
      service.publish(jobId, user),
    ).rejects.toThrow(ConflictException);
  });

  it('closes a published job opening', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const jobOpening = {
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.PUBLISHED,
      closedAt: undefined as Date | undefined,
      closedBy: undefined as Types.ObjectId | undefined,
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    jobOpeningModel.findOne.mockResolvedValue(jobOpening);

    const result = await service.close(jobId, user);

    expect(result.status).toBe(JobOpeningStatus.CLOSED);
    expect(result.closedAt).toBeInstanceOf(Date);
    expect(result.closedBy).toEqual(new Types.ObjectId(userId));
    expect(result.updatedBy).toEqual(new Types.ObjectId(userId));
    expect(save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.JOB_OPENING,
        metadata: { action: 'CLOSED' },
      }),
    );
  });

  it('rejects closing a draft job opening', async () => {
    jobOpeningModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.DRAFT,
    });

    await expect(
      service.close(jobId, user),
    ).rejects.toThrow(ConflictException);
  });

  it('archives a draft job opening', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const jobOpening = {
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.DRAFT,
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    jobOpeningModel.findOne.mockResolvedValue(jobOpening);

    const result = await service.archive(jobId, user);

    expect(result.status).toBe(JobOpeningStatus.ARCHIVED);
    expect(result.updatedBy).toEqual(new Types.ObjectId(userId));
    expect(save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.JOB_OPENING,
        metadata: { action: 'ARCHIVED' },
      }),
    );
  });

  it('archives a published job opening', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const jobOpening = {
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.PUBLISHED,
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    jobOpeningModel.findOne.mockResolvedValue(jobOpening);

    const result = await service.archive(jobId, user);

    expect(result.status).toBe(JobOpeningStatus.ARCHIVED);
    expect(save).toHaveBeenCalled();
  });

  it('rejects archiving a closed job opening', async () => {
    jobOpeningModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(jobId),
      status: JobOpeningStatus.CLOSED,
    });

    await expect(
      service.archive(jobId, user),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects an invalid job opening id', async () => {
    await expect(
      service.findOne('invalid-id', user),
    ).rejects.toThrow(NotFoundException);

    expect(jobOpeningModel.findOne).not.toHaveBeenCalled();
  });

  it('keeps job opening lookup tenant-scoped', async () => {
    jobOpeningModel.findOne.mockResolvedValue(null);

    await expect(
      service.findOne(jobId, user),
    ).rejects.toThrow(NotFoundException);

    expect(jobOpeningModel.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(jobId),
      organizationId: new Types.ObjectId(organizationId),
    });
  });
});