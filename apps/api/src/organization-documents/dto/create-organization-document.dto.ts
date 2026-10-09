import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { OrganizationDocumentCategory } from '../schemas/organization-document.schema.js';

export class CreateOrganizationDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsEnum(OrganizationDocumentCategory)
  category!: OrganizationDocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
