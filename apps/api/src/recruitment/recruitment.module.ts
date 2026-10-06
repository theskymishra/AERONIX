import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';
import { RolesModule } from '../roles/roles.module.js';

import { JobOpeningsController } from './job-openings.controller.js';
import { JobOpeningsService } from './job-openings.service.js';
import {
  JobOpening,
  JobOpeningSchema,
} from './schemas/job-opening.schema.js';

@Module({
  imports: [
    AuthModule,
    AuditLogsModule,
    RolesModule,
    MongooseModule.forFeature([
      {
        name: JobOpening.name,
        schema: JobOpeningSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [JobOpeningsController],
  providers: [JobOpeningsService],
  exports: [JobOpeningsService],
})
export class RecruitmentModule {}