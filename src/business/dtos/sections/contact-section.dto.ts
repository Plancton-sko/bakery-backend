// src/business/dto/sections/contact-section.dto.ts
import { IsString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseSectionDto } from './base-section.dto';

class FormFieldDto {
  @IsString() name: string;
  @IsString() type: 'text' | 'email' | 'tel' | 'textarea';
  @IsString() label: string;
  @IsBoolean() required: boolean;
  @IsString() placeholder?: string;
}

class ContactContentDto {
  @IsString() title: string;
  @IsString() subtitle?: string;
  @IsBoolean() showForm: boolean;
  @IsBoolean() showInfo: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  formFields: FormFieldDto[];
}

export class CreateContactSectionDto extends BaseSectionDto {
  @IsString()
  type: 'contact';

  @ValidateNested()
  @Type(() => ContactContentDto)
  content: ContactContentDto;
}
