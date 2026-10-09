import { PartialType } from '@nestjs/mapped-types';

import { CreateOrganizationDocumentDto } from './create-organization-document.dto.js';

export class UpdateOrganizationDocumentDto extends PartialType(
  CreateOrganizationDocumentDto,
) {}
