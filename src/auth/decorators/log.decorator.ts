// src/auth/decorators/log.decorator.ts
import { EnhancedNativeLogger } from "src/common/logger/nest-logger.service";


export function Log() {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const logger = new EnhancedNativeLogger(target.constructor.name);
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // Log da chamada do método
      logger.debug(
        `Method ${propertyKey} called`,
        'MethodCall', // Contexto
        { arguments: args }
      );

      try {
        const result = await originalMethod.apply(this, args);
        
        // Log do sucesso
        logger.debug(
          `Method ${propertyKey} succeeded`,
          'MethodSuccess', // Contexto
          { result: result }
        );

        return result;
      } catch (error) {
        // Log do erro
        logger.error(
          `Method ${propertyKey} failed`,
          error instanceof Error ? error.stack : 'No stack trace',
          'MethodError', // Contexto
          {
            arguments: args,
            error: error instanceof Error ? error.message : String(error)
          }
        );

        throw error;
      }
    };

    return descriptor;
  };
}