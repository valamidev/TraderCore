import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

import { StrategyInfo } from '../../strategies';
import { logger } from '../../logger';
import { StrategyService } from '../services/strategy.service';

@Controller('strategy')
export class StrategyController {
  constructor(private strategyService: StrategyService) {}

  @Get('all')
  getAll(): StrategyInfo[] {
    try {
      return this.strategyService.getAll();
    } catch (err) {
      logger.error(`NestJS API error, ${err}`);

      throw new InternalServerErrorException();
    }
  }
}
