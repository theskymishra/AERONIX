import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EmployeeDocumentType } from '../schemas/employee-document.schema.js';

export class CreateEmployeeDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsEnum(EmployeeDocumentType)
  type!: EmployeeDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000_000)
  fileSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storageKey?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  storageUrl?: string;
}
