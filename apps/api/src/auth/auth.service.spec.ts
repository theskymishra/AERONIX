import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';

describe('AuthService - getProfile', () => {
  let service: AuthService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const roleId = '6aa522bc5145273578dcdc74';

  const organizationModel = {
    findOne: vi.fn(),
  };

  const userModel = {
    findOne: vi.fn(),
    findById: vi.fn(),
  };

  const roleModel = {
    findById: vi.fn(),
  };

  const refreshSessionModel = {
    findOne: vi.fn(),
    create: vi.fn(),
  };

  const passwordService = {
    verify: vi.fn(),
    hash: vi.fn(),
  };

  const tokenService = {
    createAccessToken: vi.fn(),
    createRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };

  const configService = {
    getOrThrow: vi.fn().mockReturnValue('30d'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new AuthService(
      organizationModel as never,
      userModel as never,
      roleModel as never,
      refreshSessionModel as never,
      passwordService as never,
      tokenService as never,
      configService as never,
    );
  });

  it('should return full sanitized profile with role and permissions', async () => {
    const mockUser = {
      _id: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      email: 'alex@aeronix.io',
      firstName: 'Alex',
      lastName: 'Mercer',
      status: 'ACTIVE',
      emailVerified: true,
      roleId: new Types.ObjectId(roleId),
    };

    userModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockUser),
    });

    roleModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(roleId),
        key: 'SUPER_ADMIN',
        name: 'Super Admin',
        permissions: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGE', 'REPORTS_READ'],
      }),
    });

    const result = await service.getProfile(userId, organizationId);

    expect(result).toEqual({
      id: userId,
      userId,
      organizationId,
      email: 'alex@aeronix.io',
      firstName: 'Alex',
      lastName: 'Mercer',
      status: 'ACTIVE',
      emailVerified: true,
      role: 'SUPER_ADMIN',
      permissions: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGE', 'REPORTS_READ'],
    });
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    userModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.getProfile(userId, organizationId),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for invalid ObjectIds', async () => {
    await expect(
      service.getProfile('invalid-id', organizationId),
    ).rejects.toThrow(UnauthorizedException);
  });
});
