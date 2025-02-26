// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import session from 'express-session';
import * as csurf from 'csurf';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import { Logger, ValidationPipe } from '@nestjs/common';
import passport from 'passport';
import { EnhancedNativeLogger } from './common/logger/nest-logger.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  const logger = new EnhancedNativeLogger();
  app.useLogger(logger);

  const configService = app.get(ConfigService);


  // ==================== Helmet Configuration ====================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'trusted-scripts.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'trusted-cdn.com'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
          connectSrc: ["'self'", 'api.seuservico.com'],
          frameAncestors: ["'none'"],
        },
      },
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
      },
      referrerPolicy: { policy: 'same-origin' },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
    }),
  );

  // ==================== CORS Configuration ====================
  const corsOptions = {
    origin:
      configService.get('NODE_ENV') === 'production'
        ? [
          'https://joaodev.xyz',
          'https://www.joaodev.xyz',
          'https://bakery.joaodev.xyz',
          'https://api.joaodev.xyz',
        ]
        : ['http://localhost:3000', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  app.enableCors(corsOptions);

  // =========================== Redis ==============================

  const redisClient = createClient({
    url: process.env.REDIS_URL
  });
  redisClient.connect().catch(console.error);

  // ==================== Session Configuration ====================
  app.use(
    session({
      store: new RedisStore({ client: redisClient as any }),
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 86400 * 1000, // 1 day in ms
        sameSite: 'lax'
      },
      name: 'app.sid'
    })
  );
  // ========================== CSRF =============================
  /*
  app.use(csurf({
    cookie: {
      key: '_csrf',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  }));
  */
  // ==================== Initialize Passport ====================
  app.use(passport.initialize());
  app.use(passport.session());

  // ==================== Start the Server =======================

  app.useGlobalPipes(new ValidationPipe());

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  // console.log(`Application running on port ${port}`);
  // Modificação crítica aqui ↓
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
