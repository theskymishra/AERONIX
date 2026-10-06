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

import { CreateJobOpeningDto } from './dto/create-job-opening.dto.js';
import { JobOpeningQueryDto } from './dto/job-opening-query.dto.js';
import { UpdateJobOpeningDto } from './dto/update-job-opening.dto.js';
import { JobOpeningsService } from './job-openings.service.js';

@Controller({
  path: 'job-openings',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class JobOpeningsController {
  constructor(
    private readonly jobOpeningsService: JobOpeningsService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  create(
    @Body() dto: CreateJobOpeningDto,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.create(dto, req.user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findAll(
    @Query() query: JobOpeningQueryDto,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.findAll(query, req.user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.findOne(id, req.user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobOpeningDto,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.update(
      id,
      dto,
      req.user,
    );
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  publish(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.publish(id, req.user);
  }

  @Post(':id/close')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  close(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.close(id, req.user);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  archive(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.jobOpeningsService.archive(id, req.user);
  }
}