import { Controller, Post, InternalServerErrorException, Body } from '@nestjs/common';

import { logger } from '../../logger';
import { GridbotService } from '../services/gridbot.service';

@Controller('gridbot')
export class GridbotController {
  constructor(private gridbotService: GridbotService) { }

  @Post('backtest')
  async backtest(@Body() gridbotConfig: any): Promise<any> {
    try {
      return await this.gridbotService.backtest(gridbotConfig);
    } catch (err) {
      logger.error(`NestJS API error, ${err}`);

      throw new InternalServerErrorException();
    }
  }
}
