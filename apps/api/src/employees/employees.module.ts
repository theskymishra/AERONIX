import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Employee,
  EmployeeSchema,
} from './schemas/employee.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],

  exports: [MongooseModule],
})
export class EmployeesModule {}