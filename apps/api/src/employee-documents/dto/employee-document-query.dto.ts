import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  EmployeeDocumentStatus,
  EmployeeDocumentType,
} from '../schemas/employee-document.schema.js';

export class EmployeeDocumentQueryDto {
  @IsOptional()
  @IsString()
  @Max(160)
  search?: string;

  @IsOptional()
  @IsEnum(EmployeeDocumentType)
  type?: EmployeeDocumentType;

  @IsOptional()
  @IsEnum(EmployeeDocumentStatus)
  status?: EmployeeDocumentStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
