import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AttendanceStatus,
  AttendanceWorkMode,
} from '../schemas/attendance.schema.js';

export class CreateAttendanceDto {
  @IsDateString()
  date!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsDateString()
  checkOutAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  workedMinutes?: number;

  @IsOptional()
  @IsEnum(AttendanceWorkMode)
  workMode?: AttendanceWorkMode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
