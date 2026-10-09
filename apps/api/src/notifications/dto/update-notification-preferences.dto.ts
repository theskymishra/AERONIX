import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  leaveUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  payrollUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  performanceUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  recruitmentUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  announcementUpdates?: boolean;
}
