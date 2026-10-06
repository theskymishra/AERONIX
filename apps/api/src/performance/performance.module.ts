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

import {
  PerformanceReview,
  PerformanceReviewSchema,
} from './schemas/performance-review.schema.js';

import { PerformanceController } from './performance.controller.js';
import { PerformanceService } from './performance.service.js';

@Module({
  imports: [
    AuthModule,
    AuditLogsModule,
    EmployeesModule,
    RolesModule,
    MongooseModule.forFeature([
      {
        name: PerformanceReview.name,
        schema: PerformanceReviewSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
