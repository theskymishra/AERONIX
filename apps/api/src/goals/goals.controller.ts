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

import { CreateGoalDto } from './dto/create-goal.dto.js';
import { GoalQueryDto } from './dto/goal-query.dto.js';
import { UpdateGoalDto } from './dto/update-goal.dto.js';
import { GoalsService } from './goals.service.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    organizationId: string;
  };
}

@Controller({
  path: 'goals',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
  ) {}

  @Post('employees/:employeeId')
  @RequirePermissions(PERMISSIONS.GOAL_MANAGE)
  create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateGoalDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.create(
      employeeId,
      dto,
      req.user,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.GOAL_READ)
  findAll(
    @Query() query: GoalQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.findAll(
      query,
      req.user,
    );
  }

  @Get('mine')
  @RequirePermissions(PERMISSIONS.GOAL_READ)
  findMine(
    @Query() query: GoalQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.findMine(
      query,
      req.user,
    );
  }

  @Get('mine/:id')
  @RequirePermissions(PERMISSIONS.GOAL_READ)
  findMineOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.findMineOne(
      id,
      req.user,
    );
  }

  @Get('employees/:employeeId')
  @RequirePermissions(PERMISSIONS.GOAL_READ)
  findEmployeeGoals(
    @Param('employeeId') employeeId: string,
    @Query() query: GoalQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.findEmployeeGoals(
      employeeId,
      query,
      req.user,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.GOAL_READ)
  findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.findOne(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.GOAL_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.update(
      id,
      dto,
      req.user,
    );
  }

  @Post(':id/activate')
  @RequirePermissions(PERMISSIONS.GOAL_MANAGE)
  activate(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.activate(
      id,
      req.user,
    );
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.GOAL_MANAGE)
  complete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.complete(
      id,
      req.user,
    );
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.GOAL_MANAGE)
  cancel(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.goalsService.cancel(
      id,
      req.user,
    );
  }
}
