// src/common/filter/throttler.filter.ts
import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottlerFilter implements ExceptionFilter {
  catch(exception: HttpException) {
    const response = exception.getResponse();
    return {
      statusCode: 429,
      message: 'Muitas requisições. Por favor, tente novamente mais tarde.',
      error: 'Too Many Requests',
      details: response
    };
  }
}