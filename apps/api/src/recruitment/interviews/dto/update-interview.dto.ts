import { PartialType } from '@nestjs/mapped-types';

import { CreateInterviewDto } from './create-interview.dto.js';

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {}
