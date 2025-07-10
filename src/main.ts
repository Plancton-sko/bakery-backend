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
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


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
          connectSrc: ["'self'", 'api.seuservico.com', 'http://localhost:5173'],
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
  const isProd = configService.get('NODE_ENV') === 'production';

  const whitelist = isProd
    ? [
      'https://joaodev.xyz',
      'https://www.joaodev.xyz',
      'https://bakery.joaodev.xyz',
      'https://api.joaodev.xyz',
    ]
    : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

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
        secure: isProd,
        httpOnly: true,
        maxAge: 86400 * 1000, // 1 day in ms
        sameSite: 'lax'
      },
      name: 'app.sid'
    })
  );
  // ========================== CSRF =============================
  // app.use(
  //   csurf({
  //     cookie: {
  //       key: '_csurf', // Corrected key without space for clarity
  //       httpOnly: true,
  //       secure: false,
  //       sameSite: 'lax',
  //     },
  //   }),
  // );
  // ==================== Initialize Passport ====================

  app.use(passport.initialize());
  app.use(passport.session());

  // ==================== Global Pipes =======================

  app.useGlobalPipes(new ValidationPipe());

  // ==================== Start the Server =======================

  const port = configService.get('PORT') || 3000;
  const logger = app.get(EnhancedNativeLogger);
  app.useLogger(logger); // Configura o logger global

  logger.log('Aplicação iniciada, configurando serviços...', 'Bootstrap');

  // app.setGlobalPrefix('api');

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
console.log("executando")
bootstrap();
