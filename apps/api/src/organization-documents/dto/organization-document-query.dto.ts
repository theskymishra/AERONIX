import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  OrganizationDocumentCategory,
  OrganizationDocumentStatus,
} from '../schemas/organization-document.schema.js';

export class OrganizationDocumentQueryDto {
  @IsOptional()
  @IsEnum(OrganizationDocumentCategory)
  category?: OrganizationDocumentCategory;

  @IsOptional()
  @IsEnum(OrganizationDocumentStatus)
  status?: OrganizationDocumentStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
