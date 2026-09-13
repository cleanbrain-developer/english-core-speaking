import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { logError } from './common/logging/log-error';

// Errors outside a request (a rejected promise nobody awaited, a callback
// throwing async) never reach AllExceptionsFilter and, with no error
// tracker or log aggregator wired up, would otherwise vanish into
// `console.error`'s free-form output or crash the process with no record
// at all. Log them structured, then fail fast -- Kubernetes' restart
// policy is this app's actual recovery mechanism for a genuinely corrupt
// process state, so we don't try to keep running after one.
process.on('uncaughtException', (err) => {
  logError({}, err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logError({}, reason);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Behind the shared Gateway/Traefik reverse proxy in production -- without
  // this, req.ip (used by ThrottlerGuard to key rate limits) would resolve
  // to the proxy's address for every request instead of the real client,
  // collapsing all users into a single shared rate-limit bucket.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: config.get<string>('FRONTEND_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
