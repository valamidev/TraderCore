import { Controller, Post, InternalServerErrorException, Body } from '@nestjs/common';

import { logger } from '../../logger';
import { OptimizeConfig, BacktestService } from '../services/backtest.service';

@Controller('backtest')
export class BacktestController {
  constructor(private backtestService: BacktestService) {}

  @Post('optimize')
  async optimize(@Body() optimizeConfig: OptimizeConfig): Promise<any> {
    try {
      return await this.backtestService.optimize(optimizeConfig);
    } catch (err) {
      logger.error(`NestJS API error, ${err}`);

      throw new InternalServerErrorException();
    }
  }
}
