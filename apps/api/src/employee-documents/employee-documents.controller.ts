import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

import { PermissionGuard } from '../permissions/permission.guard.js';
import { RequirePermissions } from '../permissions/permission.decorator.js';
import { PERMISSIONS } from '../permissions/permission.constants.js';

import { CreateEmployeeDocumentDto } from './dto/create-employee-document.dto.js';
import { EmployeeDocumentQueryDto } from './dto/employee-document-query.dto.js';
import { EmployeeDocumentsService } from './employee-documents.service.js';

@Controller({
  path: 'employees/:employeeId/documents',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class EmployeeDocumentsController {
  constructor(
    private readonly employeeDocumentsService: EmployeeDocumentsService,
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
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeDocumentDto,
    @UploadedFile() file: any,
  ) {
    return this.employeeDocumentsService.create(
      user.organizationId,
      employeeId,
      user.userId,
      dto,
      file,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DOCUMENT_READ)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Query() query: EmployeeDocumentQueryDto,
  ) {
    return this.employeeDocumentsService.findAll(
      user.organizationId,
      employeeId,
      query,
    );
  }

  @Get(':documentId')
  @RequirePermissions(PERMISSIONS.DOCUMENT_READ)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.employeeDocumentsService.findOne(
      user.organizationId,
      employeeId,
      documentId,
    );
  }

  @Delete(':documentId')
  @RequirePermissions(PERMISSIONS.DOCUMENT_MANAGE)
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.employeeDocumentsService.archive(
      user.organizationId,
      employeeId,
      documentId,
      user.userId,
    );
  }
}