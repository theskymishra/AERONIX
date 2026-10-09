import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RolesModule } from '../roles/roles.module.js';

import { AnnouncementsController } from './announcements.controller.js';
import { AnnouncementsService } from './announcements.service.js';
import {
  Announcement,
  AnnouncementSchema,
} from './schemas/announcement.schema.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    NotificationsModule,
    AuditLogsModule,
    MongooseModule.forFeature([
      {
        name: Announcement.name,
        schema: AnnouncementSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
