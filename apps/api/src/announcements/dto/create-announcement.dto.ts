import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  AnnouncementPriority,
  AnnouncementTargetAudience,
} from '../schemas/announcement.schema.js';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsEnum(AnnouncementTargetAudience)
  targetAudience?: AnnouncementTargetAudience;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetDepartmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];
}
