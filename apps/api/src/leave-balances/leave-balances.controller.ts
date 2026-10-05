import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { LeaveBalancesService } from './leave-balances.service.js';
import { LeaveBalanceQueryDto } from './dto/leave-balance-query.dto.js';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

@Controller({
  path: 'leave-balances',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class LeaveBalancesController {
  constructor(
    private readonly leaveBalancesService: LeaveBalancesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LEAVE_VIEW_ALL)
  findAll(
    @Query() query: LeaveBalanceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveBalancesService.findAll(
      query,
      user,
    );
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.LEAVE_READ)
  findMine(
    @Query() query: LeaveBalanceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveBalancesService.findMine(
      query,
      user,
    );
  }

  @Get('team')
  @RequirePermissions(PERMISSIONS.LEAVE_READ)
  findTeam(
    @Query() query: LeaveBalanceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveBalancesService.findTeam(
      query,
      user,
    );
  }
}