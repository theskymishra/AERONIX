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

import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto.js';
import { PerformanceReviewQueryDto } from './dto/performance-review-query.dto.js';
import { UpdatePerformanceReviewDto } from './dto/update-performance-review.dto.js';
import { PerformanceService } from './performance.service.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    organizationId: string;
  };
}

@Controller({
  path: 'performance-reviews',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
  ) {}

  @Post('employees/:employeeId')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_MANAGE)
  create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreatePerformanceReviewDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.create(
      employeeId,
      dto,
      req.user,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PERFORMANCE_READ)
  findAll(
    @Query() query: PerformanceReviewQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.findAll(
      query,
      req.user,
    );
  }

  @Get('mine')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_READ)
  findMine(
    @Query() query: PerformanceReviewQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.findMine(
      query,
      req.user,
    );
  }

  @Get('reviewer')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_READ)
  findReviewerReviews(
    @Query() query: PerformanceReviewQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.findReviewerReviews(
      query,
      req.user,
    );
  }

  @Get('mine/:id')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_READ)
  findMineOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.findMineOne(
      id,
      req.user,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_READ)
  findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.findOne(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceReviewDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.update(
      id,
      dto,
      req.user,
    );
  }

  @Post(':id/submit')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_MANAGE)
  submit(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.submit(
      id,
      req.user,
    );
  }

  @Post(':id/acknowledge')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_READ)
  acknowledge(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.acknowledge(
      id,
      req.user,
    );
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.PERFORMANCE_MANAGE)
  complete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.performanceService.complete(
      id,
      req.user,
    );
  }
}
