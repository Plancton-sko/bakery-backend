// src/common/logger/nest-logger.service.ts
import { Logger, LoggerService } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'fs';

export class EnhancedNativeLogger extends Logger implements LoggerService {
  private logDir = 'logs';
  private logFile = `${this.logDir}/application.log`;

  constructor(context?: string) {
    super(context);
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir);
    }
  }

  log(message: string) {
    super.log(message);
    appendFileSync(this.logFile, `${new Date().toISOString()} [INFO] ${message}\n`);
  }

  error(message: string, trace: string) {
    super.error(message, trace);
    appendFileSync(this.logFile, `${new Date().toISOString()} [ERROR] ${message}\n${trace}\n`);
  }
}

// Uso:
const logger = new EnhancedNativeLogger('AuthService');