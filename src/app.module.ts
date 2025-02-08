// src/app.module.ts
import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Disponível globalmente
      envFilePath: '.env', // Define o arquivo de variáveis de ambiente
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
    PassportModule.register({ session: true }),
    UserModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // SessionSerializer,
  ],
})
export class AppModule { }
