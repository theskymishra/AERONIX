import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  LeaveRequest,
  LeaveRequestSchema,
} from './schemas/leave-request.schema.js';


import {
  LeaveType,
  LeaveTypeSchema,
} from '../leave-types/schemas/leave-type.schema.js';

import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';

import { LeaveRequestsController } from './leave-requests.controller.js';
import { LeaveRequestsService } from './leave-requests.service.js';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    AuditLogsModule,

    MongooseModule.forFeature([
      {
        name: LeaveRequest.name,
        schema: LeaveRequestSchema,
      },
      {
        name: LeaveType.name,
        schema: LeaveTypeSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],

  controllers: [
    LeaveRequestsController,
  ],

  providers: [
    LeaveRequestsService,
  ],
})
export class LeaveRequestsModule {}