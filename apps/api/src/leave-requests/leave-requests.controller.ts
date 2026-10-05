import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { LeaveRequestsService } from './leave-requests.service.js';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto.js';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto.js';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto.js';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

@Controller({ path: 'leave-requests', version: '1' })
@UseGuards(JwtAccessGuard, PermissionGuard)
export class LeaveRequestsController {
  constructor(
    private readonly leaveRequestsService: LeaveRequestsService,
  ) {}

  @Post('employees/:employeeId/leave-types/:leaveTypeId')
  @RequirePermissions(PERMISSIONS.LEAVE_CREATE)
  create(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveRequestsService.create(
      employeeId,
      leaveTypeId,
      dto,
      user,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LEAVE_VIEW_ALL)
  findAll(
    @Query() query: LeaveRequestQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveRequestsService.findAll(query, user);
  }

    @Get('mine')
  @RequirePermissions(PERMISSIONS.LEAVE_READ)
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LeaveRequestQueryDto,
  ) {
    return this.leaveRequestsService.findMine(
      query,
      user,
    );
  }

  @Get('team')
  @RequirePermissions(PERMISSIONS.LEAVE_READ)
  findTeam(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LeaveRequestQueryDto,
  ) {
    return this.leaveRequestsService.findTeam(
      query,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LEAVE_VIEW_ALL)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveRequestsService.findOne(id, user);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.LEAVE_APPROVE)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveRequestsService.approve(id, user);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.LEAVE_APPROVE)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveRequestsService.reject(id, dto, user);
  }

  @Delete(':id/cancel')
  @RequirePermissions(PERMISSIONS.LEAVE_CREATE)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveRequestsService.cancel(id, user);
  }
}
