import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuditLogsService } from '../../audit-logs/audit-logs.service.js';
import {
  AuditAction,
  AuditEntity,
} from '../../audit-logs/schemas/audit-log.schema.js';
import type { AuthenticatedUser } from '../../auth/strategies/jwt-access.strategy.js';

import {
  Application,
  ApplicationStatus,
} from '../applications/schemas/application.schema.js';

import { CancelInterviewDto } from './dto/cancel-interview.dto.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { InterviewFeedbackDto } from './dto/interview-feedback.dto.js';
import { InterviewQueryDto } from './dto/interview-query.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';

import {
  Interview,
  InterviewDocument,
  InterviewStatus,
} from './schemas/interview.schema.js';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,

    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    applicationId: string,
    dto: CreateInterviewDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);
    const applicationObjectId = this.toObjectId(applicationId);

    const application = await this.applicationModel.findOne({
      _id: applicationObjectId,
      organizationId,
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (
      application.status !== ApplicationStatus.SHORTLISTED &&
      application.status !== ApplicationStatus.INTERVIEW
    ) {
      throw new ConflictException(
        'An interview can only be scheduled for a shortlisted or interview-stage application',
      );
    }

    const scheduledAt = this.parseFutureDate(dto.scheduledAt);

    await this.ensureNoScheduleConflict(
      organizationId,
      applicationObjectId,
      scheduledAt,
      dto.durationMinutes,
    );

    const interview = await this.interviewModel.create({
      organizationId,
      jobOpeningId: application.jobOpeningId,
      candidateId: application.candidateId,
      applicationId: applicationObjectId,
      type: dto.type,
      status: InterviewStatus.SCHEDULED,
      scheduledAt,
      durationMinutes: dto.durationMinutes,
      location: dto.location,
      meetingLink: dto.meetingLink,
      interviewerIds: (dto.interviewerIds ?? []).map((id) =>
        this.toObjectId(id),
      ),
      notes: dto.notes,
      createdBy: this.toObjectId(user.userId),
    });

    if (application.status === ApplicationStatus.SHORTLISTED) {
      application.status = ApplicationStatus.INTERVIEW;
      application.updatedBy = this.toObjectId(user.userId);
      await application.save();
    }

    await this.audit(
      user,
      AuditAction.CREATE,
      interview,
      'SCHEDULE',
    );

    return interview;
  }

  async findAll(
    user: AuthenticatedUser,
    query: InterviewQueryDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.candidateId) {
      filter.candidateId = this.toObjectId(query.candidateId);
    }

    if (query.applicationId) {
      filter.applicationId = this.toObjectId(query.applicationId);
    }

    if (query.jobOpeningId) {
      filter.jobOpeningId = this.toObjectId(query.jobOpeningId);
    }

    if (query.interviewerId) {
      filter.interviewerIds = this.toObjectId(query.interviewerId);
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.interviewModel
        .find(filter)
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean()
        .exec(),

      this.interviewModel.countDocuments(filter).exec(),
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
    interviewId: string,
  ) {
    const interview = await this.interviewModel
      .findOne({
        _id: this.toObjectId(interviewId),
        organizationId: this.toObjectId(user.organizationId),
      })
      .lean()
      .exec();

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  async update(
    user: AuthenticatedUser,
    interviewId: string,
    dto: UpdateInterviewDto,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    this.ensureEditable(interview.status);

    if (dto.scheduledAt !== undefined) {
      const scheduledAt = this.parseFutureDate(dto.scheduledAt);

      await this.ensureNoScheduleConflict(
        interview.organizationId,
        interview.applicationId,
        scheduledAt,
        dto.durationMinutes ?? interview.durationMinutes,
        interview._id,
      );

      interview.scheduledAt = scheduledAt;
    }

    if (dto.type !== undefined) {
      interview.type = dto.type;
    }

    if (dto.durationMinutes !== undefined) {
      interview.durationMinutes = dto.durationMinutes;
    }

    if (dto.location !== undefined) {
      interview.location = dto.location;
    }

    if (dto.meetingLink !== undefined) {
      interview.meetingLink = dto.meetingLink;
    }

    if (dto.interviewerIds !== undefined) {
      interview.interviewerIds = dto.interviewerIds.map((id) =>
        this.toObjectId(id),
      );
    }

    if (dto.notes !== undefined) {
      interview.notes = dto.notes;
    }

    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      interview,
      'UPDATE',
    );

    return interview;
  }

  async confirm(
    user: AuthenticatedUser,
    interviewId: string,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new ConflictException(
        'Only a scheduled interview can be confirmed',
      );
    }

    interview.status = InterviewStatus.CONFIRMED;
    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      interview,
      'CONFIRM',
    );

    return interview;
  }

  async complete(
    user: AuthenticatedUser,
    interviewId: string,
    dto: InterviewFeedbackDto,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    if (
      interview.status !== InterviewStatus.SCHEDULED &&
      interview.status !== InterviewStatus.CONFIRMED
    ) {
      throw new ConflictException(
        'Only a scheduled or confirmed interview can be completed',
      );
    }

    interview.status = InterviewStatus.COMPLETED;
    interview.feedback = dto.feedback;
    interview.rating = dto.rating;
    interview.recommendation = dto.recommendation;
    interview.notes = dto.notes ?? interview.notes;
    interview.completedBy = this.toObjectId(user.userId);
    interview.completedAt = new Date();
    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      interview,
      'COMPLETE',
    );

    return interview;
  }

  async cancel(
    user: AuthenticatedUser,
    interviewId: string,
    dto: CancelInterviewDto,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    if (
      interview.status === InterviewStatus.COMPLETED ||
      interview.status === InterviewStatus.CANCELLED
    ) {
      throw new ConflictException(
        'A completed or already cancelled interview cannot be cancelled',
      );
    }

    interview.status = InterviewStatus.CANCELLED;
    interview.cancelledBy = this.toObjectId(user.userId);
    interview.cancelledAt = new Date();
    interview.cancellationReason = dto.reason;
    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.CANCEL,
      interview,
      'CANCEL',
    );

    return interview;
  }

  async reschedule(
    user: AuthenticatedUser,
    interviewId: string,
    dto: CreateInterviewDto,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    if (
      interview.status !== InterviewStatus.SCHEDULED &&
      interview.status !== InterviewStatus.CONFIRMED
    ) {
      throw new ConflictException(
        'Only a scheduled or confirmed interview can be rescheduled',
      );
    }

    const scheduledAt = this.parseFutureDate(dto.scheduledAt);

    await this.ensureNoScheduleConflict(
      interview.organizationId,
      interview.applicationId,
      scheduledAt,
      dto.durationMinutes,
      interview._id,
    );

    const newInterview = await this.interviewModel.create({
      organizationId: interview.organizationId,
      jobOpeningId: interview.jobOpeningId,
      candidateId: interview.candidateId,
      applicationId: interview.applicationId,
      type: dto.type,
      status: InterviewStatus.SCHEDULED,
      scheduledAt,
      durationMinutes: dto.durationMinutes,
      location: dto.location,
      meetingLink: dto.meetingLink,
      interviewerIds: (dto.interviewerIds ?? []).map((id) =>
        this.toObjectId(id),
      ),
      notes: dto.notes,
      rescheduledFromId: interview._id,
      createdBy: this.toObjectId(user.userId),
    });

    interview.status = InterviewStatus.RESCHEDULED;
    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      newInterview,
      'RESCHEDULE',
    );

    return newInterview;
  }

  async markNoShow(
    user: AuthenticatedUser,
    interviewId: string,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    if (
      interview.status !== InterviewStatus.SCHEDULED &&
      interview.status !== InterviewStatus.CONFIRMED
    ) {
      throw new ConflictException(
        'Only a scheduled or confirmed interview can be marked as no-show',
      );
    }

    interview.status = InterviewStatus.NO_SHOW;
    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      interview,
      'NO_SHOW',
    );

    return interview;
  }

  async addFeedback(
    user: AuthenticatedUser,
    interviewId: string,
    dto: InterviewFeedbackDto,
  ) {
    const interview = await this.getInterviewDocument(
      user.organizationId,
      interviewId,
    );

    if (interview.status !== InterviewStatus.COMPLETED) {
      throw new ConflictException(
        'Feedback can only be added to a completed interview',
      );
    }

    if (dto.feedback !== undefined) {
      interview.feedback = dto.feedback;
    }

    if (dto.rating !== undefined) {
      interview.rating = dto.rating;
    }

    if (dto.recommendation !== undefined) {
      interview.recommendation = dto.recommendation;
    }

    if (dto.notes !== undefined) {
      interview.notes = dto.notes;
    }

    interview.updatedBy = this.toObjectId(user.userId);

    await interview.save();

    await this.audit(
      user,
      AuditAction.UPDATE,
      interview,
      'FEEDBACK',
    );

    return interview;
  }

  private async getInterviewDocument(
    organizationId: string,
    interviewId: string,
  ) {
    const interview = await this.interviewModel.findOne({
      _id: this.toObjectId(interviewId),
      organizationId: this.toObjectId(organizationId),
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  private async ensureNoScheduleConflict(
    organizationId: Types.ObjectId,
    applicationId: Types.ObjectId,
    scheduledAt: Date,
    durationMinutes: number,
    excludeId?: Types.ObjectId,
  ) {
    const start = scheduledAt.getTime();
    const end = start + durationMinutes * 60 * 1000;

    const query: Record<string, unknown> = {
      organizationId,
      applicationId,
      status: {
        $in: [
          InterviewStatus.SCHEDULED,
          InterviewStatus.CONFIRMED,
        ],
      },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const interviews = await this.interviewModel.find(query).lean().exec();

    const conflict = interviews.some((interview) => {
      const existingStart = new Date(interview.scheduledAt).getTime();
      const existingEnd =
        existingStart + interview.durationMinutes * 60 * 1000;

      return start < existingEnd && end > existingStart;
    });

    if (conflict) {
      throw new ConflictException(
        'The application already has an overlapping interview scheduled',
      );
    }
  }

  private ensureEditable(status: InterviewStatus) {
    if (
      status === InterviewStatus.COMPLETED ||
      status === InterviewStatus.CANCELLED ||
      status === InterviewStatus.NO_SHOW ||
      status === InterviewStatus.RESCHEDULED
    ) {
      throw new ConflictException(
        'A completed, cancelled, no-show, or rescheduled interview cannot be updated',
      );
    }
  }

  private parseFutureDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid interview date');
    }

    if (date.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Interview must be scheduled for a future date',
      );
    }

    return date;
  }

  private async audit(
    user: AuthenticatedUser,
    action: AuditAction,
    interview: InterviewDocument | { _id: Types.ObjectId },
    lifecycle: string,
  ) {
    await this.auditLogsService.record({
      user,
      action,
      entity: AuditEntity.INTERVIEW,
      entityId: interview._id,
      metadata: {
        lifecycle,
      },
    });
  }

  private toObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ID');
    }

    return new Types.ObjectId(value);
  }
}
