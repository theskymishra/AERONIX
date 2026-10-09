import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';
import {
  Goal,
  GoalSchema,
} from '../goals/schemas/goal.schema.js';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from '../leave-requests/schemas/leave-request.schema.js';
import {
  PayrollRecord,
  PayrollRecordSchema,
} from '../payroll/schemas/payroll-record.schema.js';
import {
  PerformanceReview,
  PerformanceReviewSchema,
} from '../performance/schemas/performance-review.schema.js';
import {
  Application,
  ApplicationSchema,
} from '../recruitment/applications/schemas/application.schema.js';
import {
  Interview,
  InterviewSchema,
} from '../recruitment/interviews/schemas/interview.schema.js';
import {
  JobOpening,
  JobOpeningSchema,
} from '../recruitment/schemas/job-opening.schema.js';
import { RolesModule } from '../roles/roles.module.js';

import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: PayrollRecord.name, schema: PayrollRecordSchema },
      { name: JobOpening.name, schema: JobOpeningSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: PerformanceReview.name, schema: PerformanceReviewSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
