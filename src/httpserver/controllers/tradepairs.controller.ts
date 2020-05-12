import { Controller, Get, InternalServerErrorException, Query } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { IOHLCV } from 'candlestick-convert';
import { TradepairsService } from '../services/tradepairs.service';
import { logger } from '../../logger';

@Controller('tradepairs')
export class TradepairsController {
  constructor(private tradepairsService: TradepairsService) { }

  @Get('all')
  async getAll(): Promise<RowDataPacket[] | undefined> {
    try {
      return await this.tradepairsService.getAll();
    } catch (err) {
      logger.error(`NestJS API error, ${err}`);

      throw new InternalServerErrorException();
    }
  }

  @Get('candlestick')
  async getCandleStick(@Query() params: any): Promise<IOHLCV[]> {
    try {
      const { exchange, symbol, interval, limit } = params;

      const candleStick = await this.tradepairsService.getCandleStick(exchange, symbol, interval, limit);

      if (!candleStick) {
        return [];
      }

      return candleStick;
    } catch (err) {
      logger.error(`NestJS API error, ${err}`);

      throw new InternalServerErrorException();
    }
  }
}
