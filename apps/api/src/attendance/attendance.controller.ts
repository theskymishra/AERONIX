import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { AttendanceService } from './attendance.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import { AttendanceQueryDto } from './dto/attendance-query.dto.js';

@Controller({
  path: 'attendance',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('employees/:employeeId')
  @RequirePermissions(
    PERMISSIONS.ATTENDANCE_MANAGE,
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendanceService.create(
      user.organizationId,
      employeeId,
      user.userId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(
    PERMISSIONS.ATTENDANCE_READ,
  )
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.findAll(
      user.organizationId,
      query,
    );
  }

  @Get('employees/:employeeId')
  @RequirePermissions(
    PERMISSIONS.ATTENDANCE_READ,
  )
  findEmployeeAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.findAll(
      user.organizationId,
      {
        ...query,
        employeeId,
      },
    );
  }

  @Get(
    'employees/:employeeId/:attendanceId',
  )
  @RequirePermissions(
    PERMISSIONS.ATTENDANCE_READ,
  )
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('attendanceId') attendanceId: string,
  ) {
    return this.attendanceService.findOne(
      user.organizationId,
      employeeId,
      attendanceId,
    );
  }

  @Patch(
    'employees/:employeeId/:attendanceId',
  )
  @RequirePermissions(
    PERMISSIONS.ATTENDANCE_MANAGE,
  )
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('attendanceId') attendanceId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(
      user.organizationId,
      employeeId,
      attendanceId,
      dto,
    );
  }
}