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

import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../../permissions/permission.guard.js';
import { RequirePermissions } from '../../permissions/permission.decorator.js';
import { PERMISSIONS } from '../../permissions/permission.constants.js';

import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { ApplicationQueryDto } from './dto/application-query.dto.js';

@Controller({
  path: 'applications',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Post('/job-openings/:jobOpeningId')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  create(
    @Param('jobOpeningId') jobOpeningId: string,
    @Body() dto: CreateApplicationDto,
    @Request() req: any,
  ) {
    return this.applicationsService.create(
      jobOpeningId,
      dto,
      req.user,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findAll(
    @Query() query: ApplicationQueryDto,
    @Request() req: any,
  ) {
    return this.applicationsService.findAll(query, req.user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.findOne(id, req.user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @Request() req: any,
  ) {
    return this.applicationsService.update(
      id,
      dto,
      req.user,
    );
  }

  @Post(':id/screen')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  screen(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.screen(id, req.user);
  }

  @Post(':id/shortlist')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  shortlist(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.shortlist(id, req.user);
  }

  @Post(':id/interview')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  interview(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.interview(id, req.user);
  }

  @Post(':id/offer')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  offer(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.offer(id, req.user);
  }

  @Post(':id/hire')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  hire(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.hire(id, req.user);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @Request() req: any,
  ) {
    return this.applicationsService.reject(
      id,
      reason,
      req.user,
    );
  }
}