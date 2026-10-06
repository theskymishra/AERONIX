import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ApplicationStatus } from '../schemas/application.schema.js';
import { Type } from 'class-transformer';

export class ApplicationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  candidateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobOpeningId?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

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