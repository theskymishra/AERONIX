import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuditAction,
  AuditEntity,
} from '../../audit-logs/schemas/audit-log.schema.js';

import {
  CandidateSource,
} from './schemas/candidate.schema.js';
import { CandidatesService } from './candidates.service.js';

describe('CandidatesService', () => {
  let service: CandidatesService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const candidateId = '6ac510000000000000000001';
  const otherCandidateId = '6ac510000000000000000002';

  const user = {
    userId,
    organizationId,
  };

  const auditLogsService = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  const candidateModel = {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new CandidatesService(
      candidateModel as never,
      auditLogsService as never,
    );
  });

  const createDto = {
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876543210',
    location: 'Bengaluru',
    currentCompany: 'Tech Corp',
    currentJobTitle: 'Software Engineer',
    experienceYears: 4,
    skills: ['TypeScript', 'Node.js', 'MongoDB'],
    source: CandidateSource.LINKEDIN,
    notes: 'Strong backend candidate',
  };

  it('creates a candidate with tenant scope and audit logging', async () => {
    const createdCandidate = {
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
      ...createDto,
      email: createDto.email.toLowerCase(),
      createdBy: new Types.ObjectId(userId),
    };

    candidateModel.findOne.mockResolvedValue(null);
    candidateModel.create.mockResolvedValue(createdCandidate);

    const result = await service.create(createDto, user);

    expect(result).toEqual(createdCandidate);

    expect(candidateModel.findOne).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(organizationId),
      email: 'rahul.sharma@example.com',
    });

    expect(candidateModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: new Types.ObjectId(organizationId),
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@example.com',
        createdBy: new Types.ObjectId(userId),
      }),
    );

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        action: AuditAction.CREATE,
        entity: AuditEntity.CANDIDATE,
        entityId: candidateId,
      }),
    );
  });

  it('normalizes candidate email before creation', async () => {
    const createdCandidate = {
      _id: new Types.ObjectId(candidateId),
      email: 'rahul.sharma@example.com',
    };

    candidateModel.findOne.mockResolvedValue(null);
    candidateModel.create.mockResolvedValue(createdCandidate);

    await service.create(
      {
        ...createDto,
        email: '  RAHUL.SHARMA@EXAMPLE.COM  ',
      },
      user,
    );

    expect(candidateModel.findOne).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(organizationId),
      email: 'rahul.sharma@example.com',
    });

    expect(candidateModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'rahul.sharma@example.com',
      }),
    );
  });

  it('rejects duplicate candidate email within the organization', async () => {
    candidateModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(otherCandidateId),
    });

    await expect(
      service.create(createDto, user),
    ).rejects.toThrow(ConflictException);

    expect(candidateModel.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid resume document id', async () => {
    candidateModel.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          ...createDto,
          resumeDocumentId: 'invalid-id',
        },
        user,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(candidateModel.create).not.toHaveBeenCalled();
  });

  it('lists candidates with tenant-scoped filtering and pagination', async () => {
    const items = [
      {
        _id: new Types.ObjectId(candidateId),
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@example.com',
      },
    ];

    const query = {
      search: 'Rahul',
      source: CandidateSource.LINKEDIN,
      page: 1,
      limit: 20,
    };

    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(items),
    };

    candidateModel.find.mockReturnValue(findQuery);
    candidateModel.countDocuments.mockResolvedValue(1);

    const result = await service.findAll(query, user);

    expect(result.items).toEqual(items);

    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    });

    expect(candidateModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: new Types.ObjectId(organizationId),
        source: CandidateSource.LINKEDIN,
        $or: [
          { firstName: { $regex: 'Rahul', $options: 'i' } },
          { lastName: { $regex: 'Rahul', $options: 'i' } },
          { email: { $regex: 'Rahul', $options: 'i' } },
          { currentCompany: { $regex: 'Rahul', $options: 'i' } },
          { currentJobTitle: { $regex: 'Rahul', $options: 'i' } },
        ],
      }),
    );
  });

  it('lists candidates without optional filters', async () => {
    const items: object[] = [];

    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(items),
    };

    candidateModel.find.mockReturnValue(findQuery);
    candidateModel.countDocuments.mockResolvedValue(0);

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

    expect(candidateModel.find).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(organizationId),
    });

    expect(findQuery.skip).toHaveBeenCalledWith(10);
    expect(findQuery.limit).toHaveBeenCalledWith(10);
  });

  it('gets a candidate using tenant-scoped lookup', async () => {
    const candidate = {
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
      firstName: 'Rahul',
      lastName: 'Sharma',
    };

    candidateModel.findOne.mockResolvedValue(candidate);

    const result = await service.findOne(candidateId, user);

    expect(result).toEqual(candidate);

    expect(candidateModel.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
    });
  });

  it('rejects an invalid candidate id', async () => {
    await expect(
      service.findOne('invalid-id', user),
    ).rejects.toThrow(NotFoundException);

    expect(candidateModel.findOne).not.toHaveBeenCalled();
  });

  it('returns not found for a candidate outside the organization', async () => {
    candidateModel.findOne.mockResolvedValue(null);

    await expect(
      service.findOne(candidateId, user),
    ).rejects.toThrow(NotFoundException);

    expect(candidateModel.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
    });
  });

  it('updates a candidate and records an audit event', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const candidate = {
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@example.com',
      experienceYears: 4,
      skills: ['TypeScript'],
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    candidateModel.findOne.mockResolvedValue(candidate);

    const result = await service.update(
      candidateId,
      {
        firstName: 'Rahul Kumar',
        experienceYears: 5,
        skills: ['TypeScript', 'NestJS'],
      },
      user,
    );

    expect(result.firstName).toBe('Rahul Kumar');
    expect(result.experienceYears).toBe(5);
    expect(result.skills).toEqual(['TypeScript', 'NestJS']);
    expect(result.updatedBy).toEqual(new Types.ObjectId(userId));

    expect(save).toHaveBeenCalled();

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        action: AuditAction.UPDATE,
        entity: AuditEntity.CANDIDATE,
        entityId: candidateId,
      }),
    );
  });

  it('rejects updating a candidate to an email already used by another candidate', async () => {
    const candidate = {
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
      email: 'rahul.sharma@example.com',
    };

    const otherCandidate = {
      _id: new Types.ObjectId(otherCandidateId),
    };

    candidateModel.findOne
      .mockResolvedValueOnce(candidate)
      .mockResolvedValueOnce(otherCandidate);

    await expect(
      service.update(
        candidateId,
        {
          email: 'another@example.com',
        },
        user,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('allows updating a candidate while keeping the same email', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const candidate = {
      _id: new Types.ObjectId(candidateId),
      organizationId: new Types.ObjectId(organizationId),
      email: 'rahul.sharma@example.com',
      firstName: 'Rahul',
      updatedBy: undefined as Types.ObjectId | undefined,
      save,
    };

    candidateModel.findOne.mockResolvedValue(candidate);

    const result = await service.update(
      candidateId,
      {
        email: '  RAHUL.SHARMA@EXAMPLE.COM ',
        firstName: 'Rahul Kumar',
      },
      user,
    );

    expect(result.email).toBe('rahul.sharma@example.com');
    expect(result.firstName).toBe('Rahul Kumar');

    expect(candidateModel.findOne).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalled();
  });

  it('updates the resume document reference', async () => {
    const save = vi.fn().mockResolvedValue(undefined);

    const candidate = {
  _id: new Types.ObjectId(candidateId),
  organizationId: new Types.ObjectId(organizationId),
  email: 'rahul.sharma@example.com',
  resumeDocumentId: undefined as Types.ObjectId | undefined,
  updatedBy: undefined as Types.ObjectId | undefined,
  save,
};

    candidateModel.findOne.mockResolvedValue(candidate);

    await service.update(
      candidateId,
      {
        resumeDocumentId: '6ac510000000000000000003',
      },
      user,
    );

    expect(candidate.resumeDocumentId).toEqual(
      new Types.ObjectId('6ac510000000000000000003'),
    );

    expect(save).toHaveBeenCalled();
  });
});