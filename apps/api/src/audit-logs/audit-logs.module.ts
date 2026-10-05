import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AuditLog,
  AuditLogSchema,
} from './schemas/audit-log.schema.js';

import { AuditLogsController } from './audit-logs.controller.js';
import { AuditLogsService } from './audit-logs.service.js';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,

    MongooseModule.forFeature([
      {
        name: AuditLog.name,
        schema: AuditLogSchema,
      },
    ]),
  ],

  controllers: [
    AuditLogsController,
  ],

  providers: [
    AuditLogsService,
  ],

  exports: [
    AuditLogsService,
  ],
})
export class AuditLogsModule {}