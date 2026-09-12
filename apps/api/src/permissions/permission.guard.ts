import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesService } from '../roles/roles.service.js';

import {
  AuthenticatedUser,
} from '../auth/strategies/jwt-access.strategy.js';

import {
  PERMISSIONS_KEY,
} from './permission.decorator.js';

import type {
  Permission,
} from './permission.constants.js';

@Injectable()
export class PermissionGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<
        Permission[]
      >(
        PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<{
          user?: AuthenticatedUser;
        }>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const permissions =
      await this.rolesService
        .getUserPermissions(
          user.userId,
          user.organizationId,
        );

    const hasPermissions =
      requiredPermissions.every(
        (permission) =>
          permissions.includes(permission),
      );

    if (!hasPermissions) {
      throw new ForbiddenException(
        'Insufficient permissions',
      );
    }

    return true;
  }
}