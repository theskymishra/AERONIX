import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';

import {
  Attendance,
  AttendanceSchema,
} from './schemas/attendance.schema.js';

import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';
import { PermissionGuard } from '../permissions/permission.guard.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    MongooseModule.forFeature([
      {
        name: Attendance.name,
        schema: AttendanceSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    PermissionGuard,
  ],
  exports: [
    AttendanceService,
    MongooseModule,
  ],
})
export class AttendanceModule {}
