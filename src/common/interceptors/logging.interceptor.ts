// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EnhancedNativeLogger } from '../logger/nest-logger.service';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: EnhancedNativeLogger) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const start = Date.now();

    this.logRequest(req);

    return next.handle().pipe(
      tap({
        next: () => this.logSuccess(req, start),
        error: (err) => this.logError(req, err, start)
      })
    );
  }

  private logRequest(req: Request) {
    this.logger.debug(
      `[REQUEST] ${req.method} ${req.originalUrl}`,
      'HTTP',
      {
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip
      }
    );
  }

  private logSuccess(req: Request, start: number) {
    const duration = Date.now() - start;
    this.logger.log(
      `[RESPONSE] ${req.method} ${req.originalUrl} - ${duration}ms`,
      'HTTP',
      {
        status: 'success',
        duration: `${duration}ms`
      }
    );
  }

  private logError(req: Request, error: Error, start: number) {
    const duration = Date.now() - start;
    this.logger.error(
      `[ERROR] ${req.method} ${req.originalUrl} - ${error.message}`,
      error.stack,
      'HTTP',
      {
        status: 'error',
        duration: `${duration}ms`,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }
    );
  }
}