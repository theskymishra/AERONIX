import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PerformanceService } from './performance.service.js';
import {
  PerformanceReviewStatus,
} from './schemas/performance-review.schema.js';
import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';

describe('PerformanceService', () => {
  const organizationId = new Types.ObjectId();
  const employeeId = new Types.ObjectId();
  const reviewerId = new Types.ObjectId();
  const reviewId = new Types.ObjectId();

  const user = {
    userId: reviewerId.toString(),
    organizationId: organizationId.toString(),
  } as any;

  const employee = {
    _id: employeeId,
    organizationId,
    userId: reviewerId,
    isActive: true,
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue({}),
  };

  const employeeModel = {
    findOne: vi.fn(),
  };

  const performanceReviewModel = {
    create: vi.fn(),
    findOne: vi.fn(),
  };

  let service: PerformanceService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new PerformanceService(
      performanceReviewModel as any,
      employeeModel as any,
      auditLogsService as any,
    );
  });

  it('creates a draft performance review', async () => {
    const review = {
      _id: reviewId,
      employeeId,
      reviewerId,
      reviewPeriod: 'Q3 2026',
      status: PerformanceReviewStatus.DRAFT,
    };

    employeeModel.findOne.mockResolvedValue(employee);
    performanceReviewModel.findOne.mockResolvedValue(null);
    performanceReviewModel.create.mockResolvedValue(review);

    const result = await service.create(
      employeeId.toString(),
      {
        reviewPeriod: 'Q3 2026',
        rating: 4,
        strengths: 'Strong ownership',
      },
      user,
    );

    expect(result).toBe(review);

    expect(performanceReviewModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId,
        employeeId,
        reviewerId,
        reviewPeriod: 'Q3 2026',
        status: PerformanceReviewStatus.DRAFT,
        rating: 4,
        strengths: 'Strong ownership',
      }),
    );

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        action: AuditAction.CREATE,
        entity: AuditEntity.PERFORMANCE_REVIEW,
        entityId: reviewId,
      }),
    );
  });

  it('rejects duplicate review for the same employee, reviewer and period', async () => {
    employeeModel.findOne.mockResolvedValue(employee);
    performanceReviewModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(),
    });

    await expect(
      service.create(
        employeeId.toString(),
        {
          reviewPeriod: 'Q3 2026',
        },
        user,
      ),
    ).rejects.toThrow(ConflictException);

    expect(performanceReviewModel.create).not.toHaveBeenCalled();
  });

  it('rejects review creation for an employee in another organization', async () => {
    employeeModel.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        employeeId.toString(),
        {
          reviewPeriod: 'Q3 2026',
        },
        user,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('submits a draft review', async () => {
    const review = {
      _id: reviewId,
      reviewerId,
      status: PerformanceReviewStatus.DRAFT,
      submittedAt: undefined as Date | undefined,
      acknowledgedAt: undefined as Date | undefined,
      completedAt: undefined as Date | undefined,
      save: vi.fn().mockImplementation(async () => review),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);

    const result = await service.submit(
      reviewId.toString(),
      user,
    );

    expect(result.status).toBe(
      PerformanceReviewStatus.SUBMITTED,
    );

    expect(review.save).toHaveBeenCalled();

    expect(review.submittedAt).toBeInstanceOf(Date);

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.PERFORMANCE_REVIEW,
        entityId: reviewId,
        metadata: expect.objectContaining({
          previousStatus: PerformanceReviewStatus.DRAFT,
          newStatus: PerformanceReviewStatus.SUBMITTED,
        }),
      }),
    );
  });

  it('rejects submitting a non-draft review', async () => {
    const review = {
      _id: reviewId,
      reviewerId,
      status: PerformanceReviewStatus.SUBMITTED,
      save: vi.fn(),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);

    await expect(
      service.submit(reviewId.toString(), user),
    ).rejects.toThrow(ConflictException);

    expect(review.save).not.toHaveBeenCalled();
  });

  it('allows the reviewed employee to acknowledge a submitted review', async () => {
    const review = {
      _id: reviewId,
      employeeId,
      reviewerId,
      status: PerformanceReviewStatus.SUBMITTED,
      submittedAt: new Date(),
      acknowledgedAt: undefined as Date | undefined,
      completedAt: undefined as Date | undefined,
      save: vi.fn().mockImplementation(async () => review),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);
    employeeModel.findOne.mockResolvedValue(employee);

    const employeeUser = {
      userId: reviewerId.toString(),
      organizationId: organizationId.toString(),
    } as any;

    const result = await service.acknowledge(
      reviewId.toString(),
      employeeUser,
    );

    expect(result.status).toBe(
      PerformanceReviewStatus.ACKNOWLEDGED,
    );

    expect(review.acknowledgedAt).toBeInstanceOf(Date);

    expect(review.save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.PERFORMANCE_REVIEW,
        entityId: reviewId,
        metadata: expect.objectContaining({
          previousStatus: PerformanceReviewStatus.SUBMITTED,
          newStatus:
            PerformanceReviewStatus.ACKNOWLEDGED,
        }),
      }),
    );
  });

  it('rejects acknowledgement from the wrong employee', async () => {
    const differentEmployeeId = new Types.ObjectId();

    const review = {
      _id: reviewId,
      employeeId: differentEmployeeId,
      reviewerId,
      status: PerformanceReviewStatus.SUBMITTED,
      save: vi.fn(),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);
    employeeModel.findOne.mockResolvedValue(employee);

    await expect(
      service.acknowledge(reviewId.toString(), user),
    ).rejects.toThrow(ConflictException);

    expect(review.save).not.toHaveBeenCalled();
  });

  it('completes an acknowledged review', async () => {
    const review = {
      _id: reviewId,
      employeeId,
      reviewerId,
      status: PerformanceReviewStatus.ACKNOWLEDGED,
      submittedAt: new Date(),
      acknowledgedAt: new Date(),
      completedAt: undefined as Date | undefined,
      save: vi.fn().mockImplementation(async () => review),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);

    const result = await service.complete(
      reviewId.toString(),
      user,
    );

    expect(result.status).toBe(
      PerformanceReviewStatus.COMPLETED,
    );

    expect(review.completedAt).toBeInstanceOf(Date);

    expect(review.save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.PERFORMANCE_REVIEW,
        entityId: reviewId,
        metadata: expect.objectContaining({
          previousStatus:
            PerformanceReviewStatus.ACKNOWLEDGED,
          newStatus:
            PerformanceReviewStatus.COMPLETED,
        }),
      }),
    );
  });

  it('rejects completing a submitted review', async () => {
    const review = {
      _id: reviewId,
      reviewerId,
      status: PerformanceReviewStatus.SUBMITTED,
      save: vi.fn(),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);

    await expect(
      service.complete(reviewId.toString(), user),
    ).rejects.toThrow(ConflictException);

    expect(review.save).not.toHaveBeenCalled();
  });

  it('updates a draft review', async () => {
    const review = {
      _id: reviewId,
      reviewerId,
      status: PerformanceReviewStatus.DRAFT,
      reviewPeriod: 'Q3 2026',
      rating: 3,
      strengths: 'Good',
      save: vi.fn().mockImplementation(async () => review),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);

    const result = await service.update(
      reviewId.toString(),
      {
        rating: 5,
        strengths: 'Excellent ownership',
        comments: 'Strong quarter',
      },
      user,
    );

    expect(result.rating).toBe(5);
    expect(result.strengths).toBe(
      'Excellent ownership',
    );
    expect(result.comments).toBe(
      'Strong quarter',
    );

    expect(review.save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entity: AuditEntity.PERFORMANCE_REVIEW,
        entityId: reviewId,
      }),
    );
  });

  it('does not allow updating a submitted review', async () => {
    const review = {
      _id: reviewId,
      reviewerId,
      status: PerformanceReviewStatus.SUBMITTED,
      save: vi.fn(),
    };

    performanceReviewModel.findOne.mockResolvedValue(review);

    await expect(
      service.update(
        reviewId.toString(),
        { rating: 5 },
        user,
      ),
    ).rejects.toThrow(ConflictException);

    expect(review.save).not.toHaveBeenCalled();
  });
});