import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  AuditAction,
  AuditEntity,
} from '../../audit-logs/schemas/audit-log.schema.js';
import { AuditLogsService } from '../../audit-logs/audit-logs.service.js';

import {
  Candidate,
  CandidateDocument,
} from './schemas/candidate.schema.js';

import { CreateCandidateDto } from './dto/create-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';
import { CandidateQueryDto } from './dto/candidate-query.dto.js';

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateCandidateDto,
    user: AuthenticatedUser,
  ): Promise<CandidateDocument> {
    const organizationObjectId = this.toObjectId(user.organizationId);

    const email = dto.email.trim().toLowerCase();

    const existingCandidate = await this.candidateModel.findOne({
      organizationId: organizationObjectId,
      email,
    });

    if (existingCandidate) {
      throw new ConflictException(
        'A candidate with this email already exists in the organization',
      );
    }

    let resumeDocumentId: Types.ObjectId | undefined;

    if (dto.resumeDocumentId) {
      resumeDocumentId = this.toObjectId(dto.resumeDocumentId);
    }

    try {
      const candidate = await this.candidateModel.create({
        organizationId: organizationObjectId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phone: dto.phone?.trim(),
        location: dto.location?.trim(),
        currentCompany: dto.currentCompany?.trim(),
        currentJobTitle: dto.currentJobTitle?.trim(),
        experienceYears: dto.experienceYears,
        skills: dto.skills?.map((skill) => skill.trim()).filter(Boolean),
        resumeDocumentId,
        source: dto.source,
        notes: dto.notes?.trim(),
        createdBy: this.toObjectId(user.userId),
      });

      await this.auditLogsService.record({
        user,
        action: AuditAction.CREATE,
        entity: AuditEntity.CANDIDATE,
        entityId: candidate._id.toString(),
        metadata: {
            email: candidate.email,
            name: `${candidate.firstName} ${candidate.lastName}`,
        },
        });

      return candidate;
    } catch (error: unknown) {
      if (
        this.isDuplicateKeyError(error)
      ) {
        throw new ConflictException(
          'A candidate with this email already exists in the organization',
        );
      }

      throw error;
    }
  }

  async findAll(
    query: CandidateQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationObjectId = this.toObjectId(user.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId: organizationObjectId,
    };

    if (query.source) {
      filter.source = query.source;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();

      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } },
        { currentJobTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.candidateModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.candidateModel.countDocuments(filter),
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
  ): Promise<CandidateDocument> {
    const candidateId = this.toObjectId(id);
    const organizationObjectId = this.toObjectId(user.organizationId);

    const candidate = await this.candidateModel.findOne({
      _id: candidateId,
      organizationId: organizationObjectId,
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async update(
    id: string,
    dto: UpdateCandidateDto,
    user: AuthenticatedUser,
  ): Promise<CandidateDocument> {
    const candidate = await this.findOne(id, user);

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();

      if (email !== candidate.email) {
        const existingCandidate = await this.candidateModel.findOne({
          _id: { $ne: candidate._id },
          organizationId: this.toObjectId(user.organizationId),
          email,
        });

        if (existingCandidate) {
          throw new ConflictException(
            'A candidate with this email already exists in the organization',
          );
        }

        candidate.email = email;
      }
    }

    if (dto.firstName !== undefined) {
      candidate.firstName = dto.firstName.trim();
    }

    if (dto.lastName !== undefined) {
      candidate.lastName = dto.lastName.trim();
    }

    if (dto.phone !== undefined) {
      candidate.phone = dto.phone?.trim();
    }

    if (dto.location !== undefined) {
      candidate.location = dto.location?.trim();
    }

    if (dto.currentCompany !== undefined) {
      candidate.currentCompany = dto.currentCompany?.trim();
    }

    if (dto.currentJobTitle !== undefined) {
      candidate.currentJobTitle = dto.currentJobTitle?.trim();
    }

    if (dto.experienceYears !== undefined) {
      candidate.experienceYears = dto.experienceYears;
    }

    if (dto.skills !== undefined) {
      candidate.skills = dto.skills
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    if (dto.resumeDocumentId !== undefined) {
      candidate.resumeDocumentId = dto.resumeDocumentId
        ? this.toObjectId(dto.resumeDocumentId)
        : undefined;
    }

    if (dto.source !== undefined) {
      candidate.source = dto.source;
    }

    if (dto.notes !== undefined) {
      candidate.notes = dto.notes?.trim();
    }

    candidate.updatedBy = this.toObjectId(user.userId);

    try {
      await candidate.save();
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'A candidate with this email already exists in the organization',
        );
      }

      throw error;
    }

    await this.auditLogsService.record({
  user,
  action: AuditAction.UPDATE,
  entity: AuditEntity.CANDIDATE,
  entityId: candidate._id.toString(),
  metadata: {
    email: candidate.email,
    name: `${candidate.firstName} ${candidate.lastName}`,
  },
});

    return candidate;
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException('Invalid identifier');
    }

    return new Types.ObjectId(value);
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }
}
