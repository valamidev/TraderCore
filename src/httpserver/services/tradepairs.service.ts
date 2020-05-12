import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';

import { IOHLCV } from 'candlestick-convert';
import tradePairs from '../../tradepairs/tradepairs';

@Injectable()
export class TradepairsService {
  async getAll(): Promise<RowDataPacket[] | undefined> {
    try {
      return await tradePairs.loadAvailableTradePairs();
    } catch (err) {
      throw new Error(err);
    }
  }
  async getCandleStick(
    exchange: string,
    symbol: string,
    interval: number,
    limit: number,
  ): Promise<IOHLCV[] | undefined> {
    try {
      return await tradePairs.getCandlestickFromDB(exchange, symbol, interval, limit);
    } catch (err) {
      throw new Error(err);
    }
  }
}
