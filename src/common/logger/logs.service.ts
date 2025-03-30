// src/common/logger/logs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from './log.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel('Log') private logModel: Model<Log>) {}

  async createLog(logEntry: Partial<Log>) {
    try {
      await this.logModel.create(logEntry);
    } catch (error) {
      console.error('Erro ao salvar log no MongoDB:', error);
    }
  }
}