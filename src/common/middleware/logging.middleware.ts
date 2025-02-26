// src/common/middleware/logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EnhancedNativeLogger } from '../logger/nest-logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new EnhancedNativeLogger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Log da requisição com tipagem correta
    this.logRequest(req);

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logResponse(req, res, duration);
    });

    next();
  }

  private logRequest(req: Request) {
    this.logger.debug(
      `[REQUEST] ${req.method} ${req.originalUrl}`,
      'HTTP', // Contexto
      {
        headers: this.sanitize(req.headers),
        query: this.sanitize(req.query),
        body: this.sanitize(req.body),
        ip: req.ip
      }
    );
  }

  private logResponse(req: Request, res: Response, duration: number) {
    this.logger.debug(
      `[RESPONSE] ${req.method} ${req.originalUrl} → ${res.statusCode}`,
      'HTTP', // Contexto
      {
        status: res.statusCode,
        duration: `${duration}ms`,
        headers: this.sanitize(res.getHeaders())
      }
    );
  }

  private sanitize(data: any): any {
    const sensitiveFields = ['authorization', 'password', 'token'];
    if (typeof data !== 'object') return data;
    
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = sensitiveFields.includes(key.toLowerCase())
        ? '*****'
        : data[key];
      return acc;
    }, {} as Record<string, any>);
  }
}