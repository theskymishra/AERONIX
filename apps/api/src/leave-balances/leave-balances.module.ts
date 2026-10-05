import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LeaveBalancesController } from './leave-balances.controller.js';
import { LeaveBalancesService } from './leave-balances.service.js';

import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';

import {
  LeaveType,
  LeaveTypeSchema,
} from '../leave-types/schemas/leave-type.schema.js';

import {
  LeaveRequest,
  LeaveRequestSchema,
} from '../leave-requests/schemas/leave-request.schema.js';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,

    MongooseModule.forFeature([
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
      {
        name: LeaveType.name,
        schema: LeaveTypeSchema,
      },
      {
        name: LeaveRequest.name,
        schema: LeaveRequestSchema,
      },
    ]),
  ],
  controllers: [LeaveBalancesController],
  providers: [LeaveBalancesService],
})
export class LeaveBalancesModule {}