import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import {
  DateRangeQueryDto,
  PayrollReportQueryDto,
  ReportExportFormat,
  ReportExportQueryDto,
} from './dto/reports-query.dto.js';
import { ReportsService } from './reports.service.js';

@Controller({
  path: 'reports',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('headcount')
  @RequirePermissions(PERMISSIONS.REPORT_READ)
  getHeadcountReport(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getHeadcountReport(user);
  }

  @Get('attendance-leave')
  @RequirePermissions(PERMISSIONS.REPORT_READ)
  getAttendanceLeaveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.reportsService.getAttendanceLeaveReport(user, query);
  }

  @Get('payroll')
  @RequirePermissions(PERMISSIONS.REPORT_READ)
  getPayrollReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PayrollReportQueryDto,
  ) {
    return this.reportsService.getPayrollReport(user, query);
  }

  @Get('recruitment-funnel')
  @RequirePermissions(PERMISSIONS.REPORT_READ)
  getRecruitmentFunnelReport(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getRecruitmentFunnelReport(user);
  }

  @Get('performance-goals')
  @RequirePermissions(PERMISSIONS.REPORT_READ)
  getPerformanceGoalsReport(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getPerformanceGoalsReport(user);
  }

  @Get('workforce-intelligence')
  @RequirePermissions(PERMISSIONS.REPORT_READ)
  getWorkforceIntelligence(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getWorkforceIntelligence(user);
  }

  @Get('export')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  async exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportExportQueryDto,
    @Res() response: Response,
  ) {
    const exported = await this.reportsService.exportReport(user, query);

    if (query.format === ReportExportFormat.CSV) {
      response
        .type(exported.contentType)
        .attachment(exported.fileName)
        .send(exported.content);
    } else {
      response
        .type(exported.contentType)
        .attachment(exported.fileName)
        .json(exported.content);
    }
  }
}
