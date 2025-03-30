// src/common/filters/throttler-filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, Inject } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { EnhancedNativeLogger } from '../logger/nest-logger.service';
import { Request } from 'express'; 

@Catch(ThrottlerException)
export class ThrottlerFilter implements ExceptionFilter {
  constructor(@Inject(EnhancedNativeLogger) private readonly logger: EnhancedNativeLogger) {}

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>(); // Usa o tipo Request do Express
    const ip = request.ip; // A propriedade 'ip' agora é reconhecida


    // Registra o erro com o IP
    this.logger.error(
      `Limite de requisições excedido para o IP: ${ip} - ${exception.message}`,
      exception.stack,
      'RateLimiting',
      {
        statusCode: 429,
        details: exception.getResponse(),
        ip: ip // Inclui o IP nos metadados
      }
    );

    // Responde ao cliente
    const response = ctx.getResponse();
    response.status(429).json({
      statusCode: 429,
      message: 'Muitas requisições. Tente novamente mais tarde.',
      error: 'Too Many Requests',
    });
  }
}