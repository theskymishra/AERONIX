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
} from '../../audit-logs/schemas/audit-log.schema.js';

import {
  ApplicationStatus,
} from '../applications/schemas/application.schema.js';

import {
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
} from './schemas/interview.schema.js';

import { InterviewsService } from './interviews.service.js';

describe('InterviewsService', () => {
  let service: InterviewsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const candidateId = '6ac510000000000000000001';
  const jobOpeningId = '6ac510000000000000000002';
  const applicationId = '6ac510000000000000000003';
  const interviewId = '6ac510000000000000000004';
  const interviewerId = '6ac510000000000000000005';

  const user = {
    userId,
    organizationId,
  };

  const interviewModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  };

  const applicationModel = {
    findOne: vi.fn(),
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new InterviewsService(
      interviewModel as never,
      applicationModel as never,
      auditLogsService as never,
    );
  });

  const futureDate = () =>
    new Date(Date.now() + 24 * 60 * 60 * 1000);

  const application = (
    status: ApplicationStatus = ApplicationStatus.SHORTLISTED,
  ) => ({
    _id: new Types.ObjectId(applicationId),
    organizationId: new Types.ObjectId(organizationId),
    candidateId: new Types.ObjectId(candidateId),
    jobOpeningId: new Types.ObjectId(jobOpeningId),
    status,
    updatedBy: undefined as Types.ObjectId | undefined,
    save: vi.fn().mockResolvedValue(undefined),
  });

  const interview = (
    status: InterviewStatus = InterviewStatus.SCHEDULED,
  ) => ({
    _id: new Types.ObjectId(interviewId),
    organizationId: new Types.ObjectId(organizationId),
    jobOpeningId: new Types.ObjectId(jobOpeningId),
    candidateId: new Types.ObjectId(candidateId),
    applicationId: new Types.ObjectId(applicationId),
    type: InterviewType.VIDEO,
    status,
    scheduledAt: futureDate(),
    durationMinutes: 60,
    location: undefined as string | undefined,
    meetingLink: 'https://meet.example.com/interview',
    interviewerIds: [new Types.ObjectId(interviewerId)],
    feedback: undefined as string | undefined,
    rating: undefined as number | undefined,
    recommendation:
      undefined as InterviewRecommendation | undefined,
    notes: undefined as string | undefined,
    completedBy: undefined as Types.ObjectId | undefined,
    completedAt: undefined as Date | undefined,
    cancelledBy: undefined as Types.ObjectId | undefined,
    cancelledAt: undefined as Date | undefined,
    cancellationReason: undefined as string | undefined,
    rescheduledFromId: undefined as Types.ObjectId | undefined,
    updatedBy: undefined as Types.ObjectId | undefined,
    save: vi.fn().mockResolvedValue(undefined),
  });

  /*
   * The service uses:
   *
   * interviewModel.find(...).lean().exec()
   *
   * for schedule-conflict checks.
   */
  const mockFind = (items: unknown[] = []) => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(items),
    };

    interviewModel.find.mockReturnValue(query);

    return query;
  };

  /*
   * The public findOne() service method uses:
   *
   * interviewModel.findOne(...).lean().exec()
   *
   * while mutation methods use the hydrated document directly.
   */
  const mockFindOneLean = (item: unknown) => {
    const query = {
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(item),
    };

    interviewModel.findOne.mockReturnValue(query);

    return query;
  };

  describe('create', () => {
    it('creates an interview for a shortlisted application', async () => {
      const app = application(ApplicationStatus.SHORTLISTED);
      const created = interview();

      applicationModel.findOne.mockResolvedValue(app);

      // ensureNoScheduleConflict() uses find().lean().exec()
      mockFind([]);

      interviewModel.create.mockResolvedValue(created);

      const result = await service.create(
        user,
        applicationId,
        {
          type: InterviewType.VIDEO,
          scheduledAt: futureDate().toISOString(),
          durationMinutes: 60,
          meetingLink: 'https://meet.example.com/interview',
          interviewerIds: [interviewerId],
          notes: 'Technical screening',
        },
      );

      expect(result).toEqual(created);

      expect(applicationModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(applicationId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(interviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          applicationId: new Types.ObjectId(applicationId),
          candidateId: new Types.ObjectId(candidateId),
          jobOpeningId: new Types.ObjectId(jobOpeningId),
          type: InterviewType.VIDEO,
          status: InterviewStatus.SCHEDULED,
          durationMinutes: 60,
          createdBy: new Types.ObjectId(userId),
        }),
      );

      expect(app.status).toBe(ApplicationStatus.INTERVIEW);
      expect(app.save).toHaveBeenCalled();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.CREATE,
          entity: AuditEntity.INTERVIEW,
        }),
      );
    });

    it('rejects an application outside the organization', async () => {
      applicationModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(user, applicationId, {
          type: InterviewType.VIDEO,
          scheduledAt: futureDate().toISOString(),
          durationMinutes: 60,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(interviewModel.create).not.toHaveBeenCalled();
    });

    it('rejects an application that is not shortlisted or in interview stage', async () => {
      applicationModel.findOne.mockResolvedValue(
        application(ApplicationStatus.APPLIED),
      );

      await expect(
        service.create(user, applicationId, {
          type: InterviewType.VIDEO,
          scheduledAt: futureDate().toISOString(),
          durationMinutes: 60,
        }),
      ).rejects.toThrow(ConflictException);

      expect(interviewModel.create).not.toHaveBeenCalled();
    });

    it('rejects an interview scheduled in the past', async () => {
      applicationModel.findOne.mockResolvedValue(
        application(ApplicationStatus.SHORTLISTED),
      );

      await expect(
        service.create(user, applicationId, {
          type: InterviewType.VIDEO,
          scheduledAt: new Date(Date.now() - 60_000).toISOString(),
          durationMinutes: 60,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(interviewModel.create).not.toHaveBeenCalled();
    });

    it('rejects an overlapping interview', async () => {
      applicationModel.findOne.mockResolvedValue(
        application(ApplicationStatus.SHORTLISTED),
      );

      // ensureNoScheduleConflict() uses find().lean().exec()
      mockFind([interview()]);

      await expect(
        service.create(user, applicationId, {
          type: InterviewType.VIDEO,
          scheduledAt: futureDate().toISOString(),
          durationMinutes: 60,
        }),
      ).rejects.toThrow(ConflictException);

      expect(interviewModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns tenant-scoped interviews with pagination', async () => {
      const items = [interview()];

      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      };

      interviewModel.find.mockReturnValue(findQuery);
      interviewModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(user, {
        candidateId,
        applicationId,
        jobOpeningId,
        interviewerId,
        type: InterviewType.VIDEO,
        status: InterviewStatus.SCHEDULED,
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

      expect(interviewModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: new Types.ObjectId(organizationId),
          candidateId: new Types.ObjectId(candidateId),
          applicationId: new Types.ObjectId(applicationId),
          jobOpeningId: new Types.ObjectId(jobOpeningId),
          interviewerIds: new Types.ObjectId(interviewerId),
          type: InterviewType.VIDEO,
          status: InterviewStatus.SCHEDULED,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns an interview belonging to the organization', async () => {
      const item = interview();

      mockFindOneLean(item);

      const result = await service.findOne(user, interviewId);

      expect(result).toEqual(item);

      expect(interviewModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(interviewId),
        organizationId: new Types.ObjectId(organizationId),
      });
    });

    it('rejects an interview from another organization', async () => {
      mockFindOneLean(null);

      await expect(
        service.findOne(user, interviewId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an invalid interview id', async () => {
      await expect(
        service.findOne(user, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates a scheduled interview', async () => {
      const item = interview();

      interviewModel.findOne.mockResolvedValue(item);

      const result = await service.update(
        user,
        interviewId,
        {
          location: 'Bengaluru Office',
          notes: 'Bring laptop',
        },
      );

      expect(result.location).toBe('Bengaluru Office');
      expect(result.notes).toBe('Bring laptop');
      expect(result.updatedBy).toEqual(new Types.ObjectId(userId));
      expect(item.save).toHaveBeenCalled();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entity: AuditEntity.INTERVIEW,
        }),
      );
    });

    it('rejects updating a completed interview', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.COMPLETED),
      );

      await expect(
        service.update(user, interviewId, {
          location: 'Bengaluru Office',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirm', () => {
    it('confirms a scheduled interview', async () => {
      const item = interview(InterviewStatus.SCHEDULED);

      interviewModel.findOne.mockResolvedValue(item);

      const result = await service.confirm(user, interviewId);

      expect(result.status).toBe(InterviewStatus.CONFIRMED);
      expect(item.save).toHaveBeenCalled();
    });

    it('rejects confirming an already completed interview', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.COMPLETED),
      );

      await expect(
        service.confirm(user, interviewId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('complete', () => {
    it('completes a confirmed interview with feedback', async () => {
      const item = interview(InterviewStatus.CONFIRMED);

      interviewModel.findOne.mockResolvedValue(item);

      const result = await service.complete(
        user,
        interviewId,
        {
          feedback: 'Strong technical performance.',
          rating: 5,
          recommendation: InterviewRecommendation.STRONG_YES,
          notes: 'Move to offer stage.',
        },
      );

      expect(result.status).toBe(InterviewStatus.COMPLETED);
      expect(result.feedback).toBe('Strong technical performance.');
      expect(result.rating).toBe(5);
      expect(result.recommendation).toBe(
        InterviewRecommendation.STRONG_YES,
      );
      expect(result.completedBy).toEqual(
        new Types.ObjectId(userId),
      );
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(item.save).toHaveBeenCalled();
    });

    it('rejects completing a cancelled interview', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.CANCELLED),
      );

      await expect(
        service.complete(user, interviewId, {}),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('cancels a scheduled interview', async () => {
      const item = interview();

      interviewModel.findOne.mockResolvedValue(item);

      const result = await service.cancel(
        user,
        interviewId,
        { reason: 'Interviewer unavailable' },
      );

      expect(result.status).toBe(InterviewStatus.CANCELLED);
      expect(result.cancelledBy).toEqual(
        new Types.ObjectId(userId),
      );
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(result.cancellationReason).toBe(
        'Interviewer unavailable',
      );
      expect(item.save).toHaveBeenCalled();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CANCEL,
          entity: AuditEntity.INTERVIEW,
        }),
      );
    });

    it('rejects cancelling a completed interview', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.COMPLETED),
      );

      await expect(
        service.cancel(
          user,
          interviewId,
          { reason: 'Too late' },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('reschedule', () => {
    it('creates a new scheduled interview and marks the old one rescheduled', async () => {
      const oldInterview = interview(
        InterviewStatus.CONFIRMED,
      );

      const newInterview = {
        ...interview(),
        _id: new Types.ObjectId(
          '6ac510000000000000000006',
        ),
        status: InterviewStatus.SCHEDULED,
        rescheduledFromId: new Types.ObjectId(interviewId),
        save: vi.fn().mockResolvedValue(undefined),
      };

      /*
       * getInterviewDocument() uses findOne().exec()
       * and ensureNoScheduleConflict() uses find().lean().exec().
       *
       * Therefore do NOT mock the second findOne call for
       * the schedule-conflict check.
       */
      interviewModel.findOne.mockResolvedValue(oldInterview);

      mockFind([]);

      interviewModel.create.mockResolvedValue(newInterview);

      const result = await service.reschedule(
        user,
        interviewId,
        {
          type: InterviewType.VIDEO,
          scheduledAt: futureDate().toISOString(),
          durationMinutes: 90,
          interviewerIds: [interviewerId],
        },
      );

      expect(result).toEqual(newInterview);

      expect(oldInterview.status).toBe(
        InterviewStatus.RESCHEDULED,
      );

      expect(oldInterview.save).toHaveBeenCalled();

      expect(interviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InterviewStatus.SCHEDULED,
          rescheduledFromId: new Types.ObjectId(interviewId),
          applicationId: new Types.ObjectId(applicationId),
        }),
      );
    });

    it('rejects rescheduling a completed interview', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.COMPLETED),
      );

      await expect(
        service.reschedule(
          user,
          interviewId,
          {
            type: InterviewType.VIDEO,
            scheduledAt: futureDate().toISOString(),
            durationMinutes: 60,
          },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('markNoShow', () => {
    it('marks a scheduled interview as no-show', async () => {
      const item = interview();

      interviewModel.findOne.mockResolvedValue(item);

      const result = await service.markNoShow(
        user,
        interviewId,
      );

      expect(result.status).toBe(
        InterviewStatus.NO_SHOW,
      );

      expect(item.save).toHaveBeenCalled();
    });

    it('rejects marking a completed interview as no-show', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.COMPLETED),
      );

      await expect(
        service.markNoShow(user, interviewId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('addFeedback', () => {
    it('adds feedback to a completed interview', async () => {
      const item = interview(InterviewStatus.COMPLETED);

      interviewModel.findOne.mockResolvedValue(item);

      const result = await service.addFeedback(
        user,
        interviewId,
        {
          feedback: 'Excellent communication.',
          rating: 4,
          recommendation: InterviewRecommendation.YES,
        },
      );

      expect(result.feedback).toBe(
        'Excellent communication.',
      );

      expect(result.rating).toBe(4);

      expect(result.recommendation).toBe(
        InterviewRecommendation.YES,
      );

      expect(item.save).toHaveBeenCalled();
    });

    it('rejects feedback for a non-completed interview', async () => {
      interviewModel.findOne.mockResolvedValue(
        interview(InterviewStatus.SCHEDULED),
      );

      await expect(
        service.addFeedback(
          user,
          interviewId,
          { feedback: 'Not ready yet' },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});