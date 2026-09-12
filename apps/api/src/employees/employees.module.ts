import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema.js';

import {
  PermissionGuard,
} from '../permissions/permission.guard.js';

import {
  Employee,
  EmployeeSchema,
} from './schemas/employee.schema.js';

import {
  EmployeesController,
} from './employees.controller.js';

import {
  EmployeesService,
} from './employees.service.js';

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
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [
    EmployeesController,
  ],

  providers: [
    EmployeesService,
    PermissionGuard,
  ],

  exports: [
    EmployeesService,
    MongooseModule,
  ],
})
export class EmployeesModule {}