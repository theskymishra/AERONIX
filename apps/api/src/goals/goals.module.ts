import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { RolesModule } from '../roles/roles.module.js';

import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';

import { Goal, GoalSchema } from './schemas/goal.schema.js';
import { GoalsController } from './goals.controller.js';
import { GoalsService } from './goals.service.js';

@Module({
  imports: [
    AuthModule,
    AuditLogsModule,
    EmployeesModule,
    RolesModule,
    MongooseModule.forFeature([
      {
        name: Goal.name,
        schema: GoalSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}