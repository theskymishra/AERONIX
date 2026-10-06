import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PayrollActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}