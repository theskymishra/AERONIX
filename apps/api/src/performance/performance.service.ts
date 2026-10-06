import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema.js';

import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto.js';
import { PerformanceReviewQueryDto } from './dto/performance-review-query.dto.js';
import { UpdatePerformanceReviewDto } from './dto/update-performance-review.dto.js';
import {
  PerformanceReview,
  PerformanceReviewDocument,
  PerformanceReviewStatus,
} from './schemas/performance-review.schema.js';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(PerformanceReview.name)
    private readonly performanceReviewModel: Model<PerformanceReview>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    employeeId: string,
    dto: CreatePerformanceReviewDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const targetEmployeeId = this.validateObjectId(
      employeeId,
      'employeeId',
    );

    await this.getEmployee(
      targetEmployeeId,
      organizationId,
    );

    const reviewerId = this.validateObjectId(
      user.userId,
      'userId',
    );

    const existing = await this.performanceReviewModel.findOne({
      organizationId,
      employeeId: targetEmployeeId,
      reviewerId,
      reviewPeriod: dto.reviewPeriod,
    });

    if (existing) {
      throw new ConflictException(
        'A performance review already exists for this employee, reviewer, and review period',
      );
    }

    const review = await this.performanceReviewModel.create({
      organizationId,
      employeeId: targetEmployeeId,
      reviewerId,
      reviewPeriod: dto.reviewPeriod,
      status: PerformanceReviewStatus.DRAFT,
      rating: dto.rating,
      strengths: dto.strengths,
      areasForImprovement: dto.areasForImprovement,
      comments: dto.comments,
    });

    await this.auditLogsService.record({
      user,
      action: AuditAction.CREATE,
      entity: AuditEntity.PERFORMANCE_REVIEW,
      entityId: review._id,
      metadata: {
        employeeId: targetEmployeeId.toString(),
        reviewerId: reviewerId.toString(),
        reviewPeriod: review.reviewPeriod,
        status: review.status,
      },
    });

    return review;
  }

  async findAll(
    query: PerformanceReviewQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.employeeId !== undefined) {
      filter.employeeId = this.validateObjectId(
        query.employeeId,
        'employeeId',
      );
    }

    if (query.reviewerId !== undefined) {
      filter.reviewerId = this.validateObjectId(
        query.reviewerId,
        'reviewerId',
      );
    }

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.reviewPeriod !== undefined) {
      filter.reviewPeriod = query.reviewPeriod;
    }

    const [items, total] = await Promise.all([
      this.performanceReviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.performanceReviewModel
        .countDocuments(filter)
        .exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMine(
    query: PerformanceReviewQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const employee = await this.getCurrentEmployee(
      user,
      organizationId,
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
      employeeId: employee._id,
    };

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.reviewPeriod !== undefined) {
      filter.reviewPeriod = query.reviewPeriod;
    }

    const [items, total] = await Promise.all([
      this.performanceReviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.performanceReviewModel
        .countDocuments(filter)
        .exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findReviewerReviews(
    query: PerformanceReviewQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const reviewerId = this.validateObjectId(
      user.userId,
      'userId',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
      reviewerId,
    };

    if (query.employeeId !== undefined) {
      filter.employeeId = this.validateObjectId(
        query.employeeId,
        'employeeId',
      );
    }

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.reviewPeriod !== undefined) {
      filter.reviewPeriod = query.reviewPeriod;
    }

    const [items, total] = await Promise.all([
      this.performanceReviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.performanceReviewModel
        .countDocuments(filter)
        .exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const reviewId = this.validateObjectId(
      id,
      'reviewId',
    );

    const review = await this.performanceReviewModel
      .findOne({
        _id: reviewId,
        organizationId,
      })
      .lean()
      .exec();

    if (!review) {
      throw new NotFoundException(
        'Performance review not found',
      );
    }

    return review;
  }

  async findMineOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const reviewId = this.validateObjectId(
      id,
      'reviewId',
    );

    const employee = await this.getCurrentEmployee(
      user,
      organizationId,
    );

    const review = await this.performanceReviewModel
      .findOne({
        _id: reviewId,
        organizationId,
        employeeId: employee._id,
      })
      .lean()
      .exec();

    if (!review) {
      throw new NotFoundException(
        'Performance review not found',
      );
    }

    return review;
  }

  async update(
    id: string,
    dto: UpdatePerformanceReviewDto,
    user: AuthenticatedUser,
  ) {
    const review = await this.getReviewForMutation(
      id,
      user,
    );

    this.ensureReviewer(review, user);

    if (review.status !== PerformanceReviewStatus.DRAFT) {
      throw new ConflictException(
        `Performance review cannot be updated from ${review.status} status`,
      );
    }

    const previous = {
      reviewPeriod: review.reviewPeriod,
      rating: review.rating,
      strengths: review.strengths,
      areasForImprovement: review.areasForImprovement,
      comments: review.comments,
    };

    if (dto.reviewPeriod !== undefined) {
      review.reviewPeriod = dto.reviewPeriod;
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }

    if (dto.strengths !== undefined) {
      review.strengths = dto.strengths;
    }

    if (dto.areasForImprovement !== undefined) {
      review.areasForImprovement =
        dto.areasForImprovement;
    }

    if (dto.comments !== undefined) {
      review.comments = dto.comments;
    }

    const updatedReview = await review.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERFORMANCE_REVIEW,
      entityId: updatedReview._id,
      metadata: {
        previous,
        changes: {
          reviewPeriod: dto.reviewPeriod,
          rating: dto.rating,
          strengths: dto.strengths,
          areasForImprovement:
            dto.areasForImprovement,
          comments: dto.comments,
        },
      },
    });

    return updatedReview;
  }

  async submit(
    id: string,
    user: AuthenticatedUser,
  ) {
    const review = await this.getReviewForMutation(
      id,
      user,
    );

    this.ensureReviewer(review, user);

    if (review.status !== PerformanceReviewStatus.DRAFT) {
      throw new ConflictException(
        `Performance review cannot be submitted from ${review.status} status`,
      );
    }

    const previousStatus = review.status;

    review.status = PerformanceReviewStatus.SUBMITTED;
    review.submittedAt = new Date();

    const updatedReview = await review.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERFORMANCE_REVIEW,
      entityId: updatedReview._id,
      metadata: {
        previousStatus,
        newStatus: PerformanceReviewStatus.SUBMITTED,
        submittedAt: updatedReview.submittedAt?.toISOString(),
      },
    });

    return updatedReview;
  }

  async acknowledge(
    id: string,
    user: AuthenticatedUser,
  ) {
    const review = await this.getReviewForMutation(
      id,
      user,
    );

    await this.ensureReviewEmployee(
      review,
      user,
    );

    if (review.status !== PerformanceReviewStatus.SUBMITTED) {
      throw new ConflictException(
        `Performance review cannot be acknowledged from ${review.status} status`,
      );
    }

    const previousStatus = review.status;

    review.status = PerformanceReviewStatus.ACKNOWLEDGED;
    review.acknowledgedAt = new Date();

    const updatedReview = await review.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERFORMANCE_REVIEW,
      entityId: updatedReview._id,
      metadata: {
        previousStatus,
        newStatus: PerformanceReviewStatus.ACKNOWLEDGED,
        acknowledgedAt:
          updatedReview.acknowledgedAt?.toISOString(),
      },
    });

    return updatedReview;
  }

  async complete(
    id: string,
    user: AuthenticatedUser,
  ) {
    const review = await this.getReviewForMutation(
      id,
      user,
    );

    this.ensureReviewer(review, user);

    if (
      review.status !==
      PerformanceReviewStatus.ACKNOWLEDGED
    ) {
      throw new ConflictException(
        `Performance review cannot be completed from ${review.status} status`,
      );
    }

    const previousStatus = review.status;

    review.status = PerformanceReviewStatus.COMPLETED;
    review.completedAt = new Date();

    const updatedReview = await review.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERFORMANCE_REVIEW,
      entityId: updatedReview._id,
      metadata: {
        previousStatus,
        newStatus: PerformanceReviewStatus.COMPLETED,
        completedAt:
          updatedReview.completedAt?.toISOString(),
      },
    });

    return updatedReview;
  }

  private async getReviewForMutation(
    id: string,
    user: AuthenticatedUser,
  ): Promise<PerformanceReviewDocument> {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const reviewId = this.validateObjectId(
      id,
      'reviewId',
    );

    const review =
      await this.performanceReviewModel.findOne({
        _id: reviewId,
        organizationId,
      });

    if (!review) {
      throw new NotFoundException(
        'Performance review not found',
      );
    }

    return review;
  }

  private ensureReviewer(
    review: PerformanceReviewDocument,
    user: AuthenticatedUser,
  ) {
    if (
      review.reviewerId.toString() !== user.userId
    ) {
      throw new ConflictException(
        'Only the assigned reviewer can perform this action',
      );
    }
  }

  private async ensureReviewEmployee(
    review: PerformanceReviewDocument,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const employee = await this.getCurrentEmployee(
      user,
      organizationId,
    );

    if (
      employee._id.toString() !==
      review.employeeId.toString()
    ) {
      throw new ConflictException(
        'Only the reviewed employee can acknowledge this review',
      );
    }
  }

  private async getCurrentEmployee(
    user: AuthenticatedUser,
    organizationId: Types.ObjectId,
  ): Promise<EmployeeDocument> {
    const userId = this.validateObjectId(
      user.userId,
      'userId',
    );

    const employee = await this.employeeModel.findOne({
      organizationId,
      userId,
      isActive: true,
    });

    if (!employee) {
      throw new NotFoundException(
        'Current employee record not found',
      );
    }

    return employee;
  }

  private async getEmployee(
    employeeId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ): Promise<EmployeeDocument> {
    const employee =
      await this.employeeModel.findOne({
        _id: employeeId,
        organizationId,
      });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    return employee;
  }

  private validateObjectId(
    value: string,
    field: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return new Types.ObjectId(value);
  }
}
