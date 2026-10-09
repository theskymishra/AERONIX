import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { StorageModule } from '../storage/storage.module.js';

import { OrganizationDocumentsController } from './organization-documents.controller.js';
import { OrganizationDocumentsService } from './organization-documents.service.js';
import {
  OrganizationDocument,
  OrganizationDocumentSchema,
} from './schemas/organization-document.schema.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    AuditLogsModule,
    StorageModule,
    MongooseModule.forFeature([
      {
        name: OrganizationDocument.name,
        schema: OrganizationDocumentSchema,
      },
    ]),
  ],
  controllers: [OrganizationDocumentsController],
  providers: [OrganizationDocumentsService],
  exports: [OrganizationDocumentsService],
})
export class OrganizationDocumentsModule {}
