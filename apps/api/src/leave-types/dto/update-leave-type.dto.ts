import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveTypeDto } from './create-leave-type.dto.js';

export class UpdateLeaveTypeDto extends PartialType(CreateLeaveTypeDto) {}
