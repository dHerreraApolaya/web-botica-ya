import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { loadEnvironment } from './config/environment.js';

const bootstrap = async (): Promise<void> => {
  const environment = loadEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: environment.CORS_ORIGIN, credentials: true });
  app.setGlobalPrefix('v1');
  await app.listen(environment.PORT);
};

void bootstrap();
