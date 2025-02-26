import { ConsoleLogger, Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'fs';
import { Request, Response } from 'express';

@Injectable()
export class EnhancedNativeLogger extends ConsoleLogger {
  private logDir = 'logs';
  private logFile = `${this.logDir}/application.log`;
  private maxSize = 1024 * 1024 * 10; // 10MB

  constructor(context?: string) {
    super(context);
    this.ensureLogDir();
    this.rotateLogs();
  }

  private ensureLogDir() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private rotateLogs() {
    if (existsSync(this.logFile)) {
      const stats = statSync(this.logFile);
      if (stats.size > this.maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        renameSync(this.logFile, `${this.logDir}/application-${timestamp}.log`);
      }
    }
  }

  private sanitize(data: any): any {
    const sensitiveFields = ['password', 'token', 'authorization'];
    const sanitizeValue = (value: any) => {
      if (typeof value !== 'object') return value;
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
    try {
      const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        context: context || this.context,
        message,
        meta: this.sanitize(meta)
      }) + '\n';
      
      appendFileSync(this.logFile, entry);
      this.rotateLogs();
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }
}