import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { StorageModule } from '../storage/storage.module.js';

import { PermissionGuard } from '../permissions/permission.guard.js';

import { EmployeeDocumentsController } from './employee-documents.controller.js';
import { EmployeeDocumentsService } from './employee-documents.service.js';

import {
  EmployeeDocument,
  EmployeeDocumentSchema,
} from './schemas/employee-document.schema.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    EmployeesModule,
    StorageModule,
    MongooseModule.forFeature([
      {
        name: EmployeeDocument.name,
        schema: EmployeeDocumentSchema,
      },
    ]),
  ],

  controllers: [
    EmployeeDocumentsController,
  ],

  providers: [
    EmployeeDocumentsService,
    PermissionGuard,
  ],

  exports: [
    EmployeeDocumentsService,
    MongooseModule,
  ],
})
export class EmployeeDocumentsModule {}