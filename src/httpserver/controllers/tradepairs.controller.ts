import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { TradepairsService } from '../services/tradepairs.service';
import { logger } from '../../logger';

@Controller('tradepairs')
export class TradepairsController {
  constructor(private tradepairsService: TradepairsService) {}

  @Get('all')
  async getAll(): Promise<RowDataPacket[] | undefined> {
    try {
      return await this.tradepairsService.getAll();
    } catch (err) {
      logger.error(`NestJS API error, ${err}`);

      throw new InternalServerErrorException();
    }
  }
}
