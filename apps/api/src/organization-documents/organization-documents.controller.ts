import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { CreateOrganizationDocumentDto } from './dto/create-organization-document.dto.js';
import { OrganizationDocumentQueryDto } from './dto/organization-document-query.dto.js';
import { UpdateOrganizationDocumentDto } from './dto/update-organization-document.dto.js';
import {
  OrganizationDocumentsService,
  type UploadedDocumentFile,
} from './organization-documents.service.js';

@Controller({
  path: 'organization-documents',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class OrganizationDocumentsController {
  constructor(
    private readonly documentsService: OrganizationDocumentsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @RequirePermissions(PERMISSIONS.DOCUMENT_MANAGE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDocumentDto,
    @UploadedFile() file?: UploadedDocumentFile,
  ) {
    return this.documentsService.create(user, dto, file);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DOCUMENT_READ)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationDocumentQueryDto,
  ) {
    return this.documentsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_READ)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.documentsService.findOne(user, id);
  }

  @Get(':id/download')
  @RequirePermissions(PERMISSIONS.DOCUMENT_READ)
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const file = await this.documentsService.download(user, id);

    response
      .type(file.contentType)
      .attachment(file.fileName)
      .send(file.body);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_MANAGE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDocumentDto,
  ) {
    return this.documentsService.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_MANAGE)
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.documentsService.archive(user, id);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMISSIONS.DOCUMENT_MANAGE)
  archivePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.documentsService.archive(user, id);
  }
}
