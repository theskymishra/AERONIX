import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuditLogsService } from './audit-logs.service.js';
import { AuditLogQueryDto } from './dto/audit-log-query.dto.js';
import {
  AuditEntity,
} from './schemas/audit-log.schema.js';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller({
  path: 'audit-logs',
  version: '1',
})
@UseGuards(
  JwtAccessGuard,
  PermissionGuard,
)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.AUDIT_READ,
  )
  findAll(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.auditLogsService.findAll(
      query,
      user,
    );
  }

  @Get(':entity/:entityId')
  @RequirePermissions(
    PERMISSIONS.AUDIT_READ,
  )
  findByEntity(
    @Param('entity') entity: AuditEntity,
    @Param('entityId') entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.auditLogsService.findByEntity(
      entity,
      entityId,
      user,
    );
  }
}
