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

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { AnnouncementsService } from './announcements.service.js';
import { AnnouncementQueryDto } from './dto/announcement-query.dto.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto.js';

@Controller({
  path: 'announcements',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_MANAGE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(user, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_READ)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnnouncementQueryDto,
  ) {
    return this.announcementsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_READ)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.announcementsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_MANAGE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(user, id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_MANAGE)
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.announcementsService.publish(user, id);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_MANAGE)
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.announcementsService.archive(user, id);
  }
}
