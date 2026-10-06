import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { PayrollService } from './payroll.service.js';
import { CreatePayrollRecordDto } from './dto/create-payroll-record.dto.js';
import { UpdatePayrollRecordDto } from './dto/update-payroll-record.dto.js';
import { PayrollQueryDto } from './dto/payroll-query.dto.js';
import { PayrollActionDto } from './dto/payroll-action.dto.js';
import { PayrollSelfQueryDto } from './dto/payroll-self-query.dto.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    organizationId: string;
  };
}

@Controller({
  path: 'payroll',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
  ) {}

  @Post('employees/:employeeId')
  @RequirePermissions(PERMISSIONS.PAYROLL_MANAGE)
  create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreatePayrollRecordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.create(
      employeeId,
      dto,
      req.user,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PAYROLL_READ)
  findAll(
    @Query() query: PayrollQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.findAll(
      query,
      req.user,
    );
  }

    @Get('mine')
  @RequirePermissions(PERMISSIONS.PAYROLL_SELF_READ)
  findMine(
    @Query() query: PayrollSelfQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.findMine(
      query,
      req.user,
    );
  }

  @Get('mine/:id')
  @RequirePermissions(PERMISSIONS.PAYROLL_SELF_READ)
  findMineOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.findMineOne(
      id,
      req.user,
    );
  }

  @Get('employees/:employeeId')
  @RequirePermissions(PERMISSIONS.PAYROLL_READ)
  findEmployeePayroll(
    @Param('employeeId') employeeId: string,
    @Query() query: PayrollQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.findEmployeePayroll(
      employeeId,
      query,
      req.user,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAYROLL_READ)
  findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.findOne(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PAYROLL_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollRecordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.update(
      id,
      dto,
      req.user,
    );
  }
    @Post(':id/process')
  @RequirePermissions(PERMISSIONS.PAYROLL_MANAGE)
  process(
    @Param('id') id: string,
    @Body() dto: PayrollActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.process(id, req.user, dto.notes);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.PAYROLL_MANAGE)
  approve(
    @Param('id') id: string,
    @Body() dto: PayrollActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.approve(id, req.user, dto.notes);
  }

  @Post(':id/pay')
  @RequirePermissions(PERMISSIONS.PAYROLL_MANAGE)
  markPaid(
    @Param('id') id: string,
    @Body() dto: PayrollActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.markPaid(id, req.user, dto.notes);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.PAYROLL_MANAGE)
  cancel(
    @Param('id') id: string,
    @Body() dto: PayrollActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payrollService.cancel(id, req.user, dto.notes);
  }
}