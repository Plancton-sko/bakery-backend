// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import session from 'express-session';
import * as csurf from 'csurf';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import { Logger } from '@nestjs/common';
import passport from 'passport';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

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

  // ==================== Redis Client ====================
  const redisClient = createClient({
    url: configService.get('REDIS_URL'),
    legacyMode: true,
    socket: {
      reconnectStrategy: (attempts) => {
        console.log(`Tentativa de reconexão #${attempts}`);
        return Math.min(attempts * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Erro no cliente Redis:', err);
  });

  redisClient.on('connect', () => {
    console.log('Conectando ao Redis...');
  });

  redisClient.on('ready', () => {
    console.log('Conexão com Redis estabelecida com sucesso!');
  });

  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Erro detalhado:', error);
    if (error instanceof AggregateError) {
      console.error('Erros individuais:');
      error.errors.forEach((e, i) => console.error(`[${i}]`, e));
    }
    process.exit(1);
  }

  // ==================== Session Configuration ====================
  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'session:',
        ttl: 86400 // 1 day in seconds
      }),
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: configService.get('NODE_ENV') === 'production',
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

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
