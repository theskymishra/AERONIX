import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { LeaveTypesService } from './leave-types.service.js';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto.js';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto.js';
import { LeaveTypeQueryDto } from './dto/leave-type-query.dto.js';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

@Controller({ path: 'leave-types', version: '1' })
@UseGuards(JwtAccessGuard, PermissionGuard)
export class LeaveTypesController {
  constructor(
    private readonly leaveTypesService: LeaveTypesService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.LEAVE_MANAGE)
  create(
    @Body() dto: CreateLeaveTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveTypesService.create(dto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LEAVE_READ)
  findAll(
    @Query() query: LeaveTypeQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveTypesService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LEAVE_READ)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveTypesService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LEAVE_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveTypesService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LEAVE_MANAGE)
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveTypesService.deactivate(id, user);
  }
}
