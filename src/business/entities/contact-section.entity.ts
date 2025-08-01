// src/business/entities/contact-section.entity.ts
import { ChildEntity, Column } from 'typeorm';
import { PageSection } from './page-section.entity';

@ChildEntity('contact')
export class ContactSection extends PageSection {
  @Column('jsonb')
  content: {
    title: string;
    subtitle?: string;
    showForm: boolean;
    showInfo: boolean;
    formFields: Array<{
      name: string;
      type: 'text' | 'email' | 'tel' | 'textarea';
      label: string;
      required: boolean;
      placeholder?: string;
    }>;
  };
}