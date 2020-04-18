import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';

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
}
