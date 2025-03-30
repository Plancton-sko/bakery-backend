// src/common/logger/log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema()
export class Log extends Document {
  @Prop({ required: true })
  timestamp: string;

  @Prop({ required: true })
  level: string;

  @Prop()
  context: string;

  @Prop({ type: SchemaTypes.Mixed, required: true }) // Define como Mixed para aceitar qualquer tipo
  message: any;

  @Prop({ type: SchemaTypes.Mixed })
  meta: Record<string, any>;
}

export const LogSchema = SchemaFactory.createForClass(Log);