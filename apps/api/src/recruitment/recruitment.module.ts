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

import { Application, ApplicationSchema } from './applications/schemas/application.schema.js';
import { ApplicationsService } from './applications/applications.service.js';
import { ApplicationsController } from './applications/applications.controller.js';

import {
  Candidate,
  CandidateSchema,
} from './candidates/schemas/candidate.schema.js';

import { CandidatesService } from './candidates/candidates.service.js';
import { CandidatesController } from './candidates/candidates.controller.js';

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
      {
        name: Candidate.name,
        schema: CandidateSchema,
      },
      {
        name: Application.name,
        schema: ApplicationSchema,
      },
    ]),
  ],
  controllers: [JobOpeningsController, CandidatesController, ApplicationsController],
  providers: [JobOpeningsService, CandidatesService, ApplicationsService],
  exports: [JobOpeningsService, CandidatesService, ApplicationsService],
})
export class RecruitmentModule {}