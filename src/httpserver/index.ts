import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@nestjs/common';
import { logger } from '../logger';
import { MainModule } from './main.module';

class NestLogger implements LoggerService {
  log(message: string): void {
    logger.verbose(message);
  }
  error(message: string, trace: string): void {
    logger.error(`error: ${message}, trace:  ${trace}`);
  }
  warn(message: string): void {
    logger.error(message);
  }
  debug(message: string): void {
    logger.verbose(message);
  }
  verbose(message: string): void {
    logger.verbose(message);
  }
}

export async function bootstrap(port: number): Promise<void> {
  const app = await NestFactory.create(MainModule, {
    logger: new NestLogger(),
  });
  app.enableCors();
  await app.listen(port);
}
