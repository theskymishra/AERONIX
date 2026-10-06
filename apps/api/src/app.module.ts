import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthController } from './health/health.controller.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RolesModule } from './roles/roles.module.js';
import { validateEnvironment } from './config/env.validation.js';
import { EmployeesModule } from './employees/employees.module.js';
import { CareerEventsModule } from './career-events/career-events.module.js';
import { EmployeeDocumentsModule } from './employee-documents/employee-documents.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { LeaveTypesModule } from './leave-types/leave-types.module.js';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module.js';
import { LeaveBalancesModule } from './leave-balances/leave-balances.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { PayrollModule } from './payroll/payroll.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { PerformanceModule } from './performance/performance.module.js';
import { RecruitmentModule } from './recruitment/recruitment.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    OrganizationsModule,
    UsersModule,
    AuthModule,
    RolesModule,
    EmployeesModule,
    CareerEventsModule,
    EmployeeDocumentsModule,
    AttendanceModule,
    LeaveTypesModule,
    LeaveRequestsModule,
    LeaveBalancesModule,
    AuditLogsModule,
    PayrollModule,
    GoalsModule,
    PerformanceModule,
    RecruitmentModule,
  ],

  controllers: [HealthController],
})
export class AppModule {}