import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class PayrollReportQueryDto {
  @IsOptional()
  @IsString()
  payPeriod?: string;
}

export enum ReportExportType {
  HEADCOUNT = 'headcount',
  ATTENDANCE = 'attendance',
  PAYROLL = 'payroll',
  RECRUITMENT = 'recruitment',
  PERFORMANCE = 'performance',
  INTELLIGENCE = 'intelligence',
}

export enum ReportExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

export class ReportExportQueryDto {
  @IsEnum(ReportExportType)
  type!: ReportExportType;

  @IsOptional()
  @IsEnum(ReportExportFormat)
  format?: ReportExportFormat = ReportExportFormat.JSON;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  payPeriod?: string;
}
