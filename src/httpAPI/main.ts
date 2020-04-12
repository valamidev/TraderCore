import { NestFactory } from '@nestjs/core';
import { logger } from '../logger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap().catch(err => {
  logger.error('Http Server cannot be started: ', err);
  process.exit(1);
});
