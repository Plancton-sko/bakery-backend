// src/highlight/dtos/update-highlight.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateHighlightDto } from './create-highlight.dto';

export class UpdateHighlightDto extends PartialType(CreateHighlightDto) {}
