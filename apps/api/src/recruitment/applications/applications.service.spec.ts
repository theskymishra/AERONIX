import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuditAction,
  AuditEntity,
} from '../../audit-logs/schemas/audit-log.schema.js';

import { JobOpeningStatus } from '../schemas/job-opening.schema.js';

import { ApplicationStatus } from './schemas/application.schema.js';

import { ApplicationsService } from './applications.service.js';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const candidateId = '6ac510000000000000000001';
  const jobOpeningId = '6ac510000000000000000002';
  const applicationId = '6ac510000000000000000003';

  const user = {
    userId,
    organizationId,
  };

  const candidateModel = {
    findOne: vi.fn(),
  };

  const jobOpeningModel = {
    findOne: vi.fn(),
  };

  const applicationModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new ApplicationsService(
      applicationModel as never,
      candidateModel as never,
      jobOpeningModel as never,
      auditLogsService as never,
    );
  });

  const candidate = {
    _id: new Types.ObjectId(candidateId),
    organizationId: new Types.ObjectId(organizationId),
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul@example.com',
  };

  const createJobOpening = (status: JobOpeningStatus) => ({
    _id: new Types.ObjectId(jobOpeningId),
    organizationId: new Types.ObjectId(organizationId),
    title: 'Senior Software Engineer',
    status,
  });

  const createApplication = (
    status: ApplicationStatus = ApplicationStatus.APPLIED,
  ) => ({
    _id: new Types.ObjectId(applicationId),
    organizationId: new Types.ObjectId(organizationId),
    candidateId: new Types.ObjectId(candidateId),
    jobOpeningId: new Types.ObjectId(jobOpeningId),
    status,
    appliedAt: new Date(),
    createdBy: new Types.ObjectId(userId),
    save: vi.fn().mockResolvedValue(undefined),
  });

  describe('create', () => {
    it('creates an application for a valid candidate and job', async () => {
      const jobOpening = createJobOpening(JobOpeningStatus.PUBLISHED);

      const created = createApplication();

      candidateModel.findOne.mockResolvedValue(candidate);
      jobOpeningModel.findOne.mockResolvedValue(jobOpening);
      applicationModel.findOne.mockResolvedValue(null);
      applicationModel.create.mockResolvedValue(created);

      const result = await service.create(
        jobOpeningId,
        {
          candidateId,
          coverLetter: 'I am interested in this role.',
          source: 'LINKEDIN',
          notes: 'Strong backend candidate',
        },
        user,
      );

      expect(result).toEqual(created);

      expect(candidateModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(candidateId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(jobOpeningModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(jobOpeningId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(applicationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          candidateId: new Types.ObjectId(candidateId),
          jobOpeningId: new Types.ObjectId(jobOpeningId),
          status: ApplicationStatus.APPLIED,
          createdBy: new Types.ObjectId(userId),
        }),
      );

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.CREATE,
          entity: AuditEntity.APPLICATION,
          entityId: applicationId,
        }),
      );
    });

    it('rejects a candidate that does not belong to the organization', async () => {
      candidateModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          jobOpeningId,
          { candidateId },
          user,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(jobOpeningModel.findOne).not.toHaveBeenCalled();
      expect(applicationModel.create).not.toHaveBeenCalled();
    });

    it('rejects a job opening that does not belong to the organization', async () => {
      candidateModel.findOne.mockResolvedValue(candidate);
      jobOpeningModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          jobOpeningId,
          { candidateId },
          user,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(applicationModel.create).not.toHaveBeenCalled();
    });

    it('rejects applications for a closed job opening', async () => {
      candidateModel.findOne.mockResolvedValue(candidate);
      jobOpeningModel.findOne.mockResolvedValue(
        createJobOpening(JobOpeningStatus.CLOSED),
      );

      await expect(
        service.create(
          jobOpeningId,
          { candidateId },
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(applicationModel.create).not.toHaveBeenCalled();
    });

    it('rejects applications for an archived job opening', async () => {
      candidateModel.findOne.mockResolvedValue(candidate);
      jobOpeningModel.findOne.mockResolvedValue(
        createJobOpening(JobOpeningStatus.ARCHIVED),
      );

      await expect(
        service.create(
          jobOpeningId,
          { candidateId },
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(applicationModel.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate application', async () => {
      candidateModel.findOne.mockResolvedValue(candidate);
      jobOpeningModel.findOne.mockResolvedValue(
        createJobOpening(JobOpeningStatus.PUBLISHED),
      );
      applicationModel.findOne.mockResolvedValue(
        createApplication(),
      );

      await expect(
        service.create(
          jobOpeningId,
          { candidateId },
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(applicationModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lists applications with tenant-scoped filters', async () => {
      const items = [createApplication()];

      const query = {
        candidateId,
        jobOpeningId,
        status: ApplicationStatus.APPLIED,
        page: 1,
        limit: 20,
      };

      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      applicationModel.find.mockReturnValue(findQuery);
      applicationModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(query, user);

      expect(result.items).toEqual(items);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });

      expect(applicationModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(organizationId),
        candidateId: new Types.ObjectId(candidateId),
        jobOpeningId: new Types.ObjectId(jobOpeningId),
        status: ApplicationStatus.APPLIED,
      });
    });

    it('lists applications without optional filters', async () => {
      const items: object[] = [];

      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      applicationModel.find.mockReturnValue(findQuery);
      applicationModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll(
        {
          page: 2,
          limit: 10,
        },
        user,
      );

      expect(result.items).toEqual([]);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 0,
        pages: 0,
      });

      expect(applicationModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(findQuery.skip).toHaveBeenCalledWith(10);
      expect(findQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('returns an application using tenant-scoped lookup', async () => {
      const application = createApplication();

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.findOne(
        applicationId,
        user,
      );

      expect(result).toEqual(application);

      expect(applicationModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(applicationId),
        organizationId: new Types.ObjectId(organizationId),
      });
    });

    it('throws when the application does not exist', async () => {
      applicationModel.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(applicationId, user),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an application', async () => {
      const application = createApplication();

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.update(
        applicationId,
        {
          coverLetter: 'Updated cover letter',
          source: 'REFERRAL',
          notes: 'Updated notes',
        },
        user,
      );

      expect(result.coverLetter).toBe(
        'Updated cover letter',
      );
      expect(result.source).toBe('REFERRAL');
      expect(result.notes).toBe('Updated notes');
      expect(result.updatedBy).toEqual(
        new Types.ObjectId(userId),
      );

      expect(application.save).toHaveBeenCalled();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.UPDATE,
          entity: AuditEntity.APPLICATION,
          entityId: applicationId,
        }),
      );
    });

    it('rejects updates to a hired application', async () => {
      const application = createApplication(
        ApplicationStatus.HIRED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      await expect(
        service.update(
          applicationId,
          { notes: 'Attempted update' },
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(application.save).not.toHaveBeenCalled();
    });

    it('rejects updates to a rejected application', async () => {
      const application = createApplication(
        ApplicationStatus.REJECTED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      await expect(
        service.update(
          applicationId,
          { notes: 'Attempted update' },
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(application.save).not.toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    it('moves APPLIED to SCREENING', async () => {
      const application = createApplication(
        ApplicationStatus.APPLIED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.screen(
        applicationId,
        user,
      );

      expect(result.status).toBe(
        ApplicationStatus.SCREENING,
      );
      expect(result.screenedAt).toBeInstanceOf(Date);
      expect(result.screenedBy).toEqual(
        new Types.ObjectId(userId),
      );
      expect(application.save).toHaveBeenCalled();
    });

    it('moves SCREENING to SHORTLISTED', async () => {
      const application = createApplication(
        ApplicationStatus.SCREENING,
      );

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.shortlist(
        applicationId,
        user,
      );

      expect(result.status).toBe(
        ApplicationStatus.SHORTLISTED,
      );
      expect(result.shortlistedAt).toBeInstanceOf(Date);
      expect(application.save).toHaveBeenCalled();
    });

    it('moves SHORTLISTED to INTERVIEW', async () => {
      const application = createApplication(
        ApplicationStatus.SHORTLISTED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.interview(
        applicationId,
        user,
      );

      expect(result.status).toBe(
        ApplicationStatus.INTERVIEW,
      );
      expect(application.save).toHaveBeenCalled();
    });

    it('moves INTERVIEW to OFFERED', async () => {
      const application = createApplication(
        ApplicationStatus.INTERVIEW,
      );

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.offer(
        applicationId,
        user,
      );

      expect(result.status).toBe(
        ApplicationStatus.OFFERED,
      );
      expect(application.save).toHaveBeenCalled();
    });

    it('moves OFFERED to HIRED', async () => {
      const application = createApplication(
        ApplicationStatus.OFFERED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.hire(
        applicationId,
        user,
      );

      expect(result.status).toBe(
        ApplicationStatus.HIRED,
      );
      expect(application.save).toHaveBeenCalled();
    });

    it('rejects an invalid lifecycle transition', async () => {
      const application = createApplication(
        ApplicationStatus.APPLIED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      await expect(
        service.shortlist(
          applicationId,
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(application.save).not.toHaveBeenCalled();
    });

    it('rejects an application and records rejection details', async () => {
      const application = createApplication(
        ApplicationStatus.INTERVIEW,
      );

      applicationModel.findOne.mockResolvedValue(application);

      const result = await service.reject(
        applicationId,
        'Candidate withdrew from the process',
        user,
      );

      expect(result.status).toBe(
        ApplicationStatus.REJECTED,
      );

      expect(result.rejectedAt).toBeInstanceOf(Date);

      expect(result.rejectedBy).toEqual(
        new Types.ObjectId(userId),
      );

      expect(result.rejectionReason).toBe(
        'Candidate withdrew from the process',
      );

      expect(application.save).toHaveBeenCalled();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.UPDATE,
          entity: AuditEntity.APPLICATION,
          entityId: applicationId,
        }),
      );
    });

    it('rejects invalid rejection from HIRED status', async () => {
      const application = createApplication(
        ApplicationStatus.HIRED,
      );

      applicationModel.findOne.mockResolvedValue(application);

      await expect(
        service.reject(
          applicationId,
          'Too late',
          user,
        ),
      ).rejects.toThrow(ConflictException);

      expect(application.save).not.toHaveBeenCalled();
    });
  });
});