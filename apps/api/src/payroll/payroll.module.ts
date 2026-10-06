import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { RolesModule } from '../roles/roles.module.js';

import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';

import {
  PayrollRecord,
  PayrollRecordSchema,
} from './schemas/payroll-record.schema.js';

import { PayrollController } from './payroll.controller.js';
import { PayrollService } from './payroll.service.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    AuditLogsModule,
    EmployeesModule,

    MongooseModule.forFeature([
      {
        name: PayrollRecord.name,
        schema: PayrollRecordSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}