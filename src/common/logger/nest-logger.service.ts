// src/common/logger/nest-logger.service.ts
import { ConsoleLogger, Inject, Injectable, Optional } from '@nestjs/common';
import { LogsService } from './logs.service';

@Injectable()
export class EnhancedNativeLogger extends ConsoleLogger {
  constructor(
    @Optional() @Inject(LogsService) private readonly logsService?: LogsService,
    context?: string,
  ) {
    super(context);
  }

  private sanitize(data: any): any {
    const sensitiveFields = ['password', 'token', 'authorization'];
    const sanitizeValue = (value: any) => {
      if (value === null || value === undefined || typeof value !== 'object') return value;
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = sensitiveFields.includes(key.toLowerCase())
          ? '*****'
          : sanitizeValue(value[key]);
        return acc;
      }, {} as Record<string, any>);
    };
    return sanitizeValue(data);
  }

  log(message: any, context?: string, meta?: Record<string, any>) {
    super.log(message, context);
    this.writeLog('INFO', message, context, meta);
  }

  error(message: any, stack?: string, context?: string, meta?: Record<string, any>) {
    super.error(message, stack, context);
    this.writeLog('ERROR', { message, stack }, context, meta);
  }

  warn(message: any, context?: string, meta?: Record<string, any>) {
    super.warn(message, context);
    this.writeLog('WARN', message, context, meta);
  }

  debug(message: any, context?: string, meta?: Record<string, any>) {
    super.debug(message, context);
    this.writeLog('DEBUG', message, context, meta);
  }

  verbose(message: any, context?: string, meta?: Record<string, any>) {
    super.verbose(message, context);
    this.writeLog('VERBOSE', message, context, meta);
  }

  private writeLog(level: string, message: any, context?: string, meta?: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: context || this.context,
      message,
      meta: this.sanitize(meta),
    };
    if (this.logsService) {
      this.logsService.createLog(logEntry);
    } 
  }
}