import { Controller, Post, InternalServerErrorException, Body } from '@nestjs/common';

import { logger } from '../../logger';
import { GridbotService, GridbotConfig } from '../services/gridbot.service';

@Controller('gridbot')
export class GridbotController {
  constructor(private gridbotService: GridbotService) {}

  @Post('backtest')
  async backtest(@Body() gridbotConfig: GridbotConfig): Promise<any> {
    try {
      return await this.gridbotService.backtest(gridbotConfig);
    } catch (err) {
      logger.error(`NestJS API error, ${err} , Body: ${JSON.stringify(gridbotConfig)}`);

      throw new InternalServerErrorException();
    }
  }
}
