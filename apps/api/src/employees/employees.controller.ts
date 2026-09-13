
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

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator.js';

import {
  JwtAccessGuard,
} from '../auth/guards/jwt-access.guard.js';

import {
  PERMISSIONS,
} from '../permissions/permission.constants.js';

import {
  RequirePermissions,
} from '../permissions/permission.decorator.js';

import {
  PermissionGuard,
} from '../permissions/permission.guard.js';

import type {
  AuthenticatedUser,
} from '../auth/strategies/jwt-access.strategy.js';

import {
  CreateEmployeeDto,
} from './dto/create-employee.dto.js';

import {
  EmployeeQueryDto,
} from './dto/employee-query.dto.js';

import {
  UpdateEmployeeDto,
} from './dto/update-employee.dto.js';

import {
  EmployeesService,
} from './employees.service.js';

@Controller({
  path: 'employees',
  version: '1',
})
@UseGuards(
  JwtAccessGuard,
  PermissionGuard,
)
export class EmployeesController {
  constructor(
    private readonly employeesService:
      EmployeesService,
  ) {}

  @Post()
  @RequirePermissions(
    PERMISSIONS.EMPLOYEE_CREATE,
  )
  create(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(
      user.organizationId,
      dto,
      user.userId,
    );
  }

  @Get()
  @RequirePermissions(
    PERMISSIONS.EMPLOYEE_READ,
  )
  findAll(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query: EmployeeQueryDto,
  ) {
    return this.employeesService.findAll(
      user.organizationId,
      query,
    );
  }

  @Get(':id')
  @RequirePermissions(
    PERMISSIONS.EMPLOYEE_READ,
  )
  findOne(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param('id')
    employeeId: string,
  ) {
    return this.employeesService.findOne(
      user.organizationId,
      employeeId,
    );
  }
    @Get(':id/360')
  @RequirePermissions(
    PERMISSIONS.EMPLOYEE_READ,
  )
  find360(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param('id')
    employeeId: string,
  ) {
    return this.employeesService.find360(
      user.organizationId,
      employeeId,
    );
  }
  @Get(':id/career-timeline')
  @RequirePermissions(PERMISSIONS.EMPLOYEE_READ)
  findCareerTimeline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
  ) {
  return this.employeesService.findCareerTimeline(
      user.organizationId,
      employeeId,
    );
  }
  @Patch(':id')
  @RequirePermissions(
    PERMISSIONS.EMPLOYEE_UPDATE,
  )
  update(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param('id')
    employeeId: string,

    @Body()
    dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(
      user.organizationId,
      employeeId,
      dto,
      user.userId,
    );
  }

  @Delete(':id')
  @RequirePermissions(
    PERMISSIONS.EMPLOYEE_DELETE,
  )
  deactivate(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param('id')
    employeeId: string,
  ) {
    return this.employeesService.deactivate(
      user.organizationId,
      employeeId,
      user.userId,
    );
  }
}

