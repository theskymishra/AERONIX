import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LeaveTypesController } from './leave-types.controller.js';
import { LeaveTypesService } from './leave-types.service.js';
import {
  LeaveType,
  LeaveTypeSchema,
} from './schemas/leave-type.schema.js';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { PermissionGuard } from '../permissions/permission.guard.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    MongooseModule.forFeature([
      {
        name: LeaveType.name,
        schema: LeaveTypeSchema,
      },
    ]),
  ],
  controllers: [LeaveTypesController],
  providers: [LeaveTypesService, PermissionGuard],
  exports: [LeaveTypesService, MongooseModule],
})
export class LeaveTypesModule {}
