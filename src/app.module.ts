// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from './auth/session.serializer';
import { RedisModule } from './redis/redis.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EnhancedNativeLogger } from './common/logger/nest-logger.service';
import { ThrottlerFilter } from './common/filter/throttler.filter';
import { MongooseModule } from '@nestjs/mongoose';
import { LogSchema } from './common/logger/log.schema';
import { LogsService } from './common/logger/logs.service';
import { ProductModule } from './products/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Disponível globalmente
      envFilePath: '.env', // Define o arquivo de variáveis de ambiente
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    // Configuração assíncrona do TypeOrm
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User],
        synchronize: true, // Alterar para `false` em produção
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'Log', schema: LogSchema }]),
    PassportModule.register({ session: true }),
    UserModule,
    AuthModule,
    RedisModule,
    ProductModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LogsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ThrottlerFilter,
    EnhancedNativeLogger,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*'); // Aplica a todas as rotas
  }
}
