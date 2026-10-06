import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsMongoId,
  MaxLength,
  Min,
} from 'class-validator';

import {
  EmploymentType,
  WorkMode,
} from '../schemas/job-opening.schema.js';

export class CreateJobOpeningDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  team?: string;

  @IsMongoId()
  hiringManagerId!: string;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsEnum(WorkMode)
  workMode!: WorkMode;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  salaryCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  requirements?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
