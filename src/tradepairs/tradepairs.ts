/* eslint-disable no-extra-semi */

import _ from 'lodash';
import CandleConvert, { Trade, OHLCV, IOHLCV } from 'candlestick-convert';
import { RowDataPacket } from 'mysql2';

import { batchedOHLCV } from '../types';

import { Utils } from '../utils';
import { logger } from '../logger';
import { BaseDB, ExchangeDB } from '../database';
import { EXCHANGE_BASE_INTERVAL_IN_SEC } from '../constants';

class TradePairs {
  public async getBatchedCandlestickMap(
    exchange: string,
    symbol: string,
    intervalsTimeInSec: number[] = [EXCHANGE_BASE_INTERVAL_IN_SEC],
    limit: number,
  ): Promise<batchedOHLCV | undefined> {
    try {
      const limitCandlestick = ~~(
        limit +
        ((_.max(intervalsTimeInSec) as number) / EXCHANGE_BASE_INTERVAL_IN_SEC) * 1.5
      );

      const batch = {};
      const result = new Map();

      if (exchange && symbol && intervalsTimeInSec && limitCandlestick) {
        const candledata = await this.getCandlestickFromDB(
          exchange,
          symbol,
          EXCHANGE_BASE_INTERVAL_IN_SEC,
          limitCandlestick,
        );

        batch[EXCHANGE_BASE_INTERVAL_IN_SEC] = candledata;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        batch[EXCHANGE_BASE_INTERVAL_IN_SEC].map((elem: any) => {
          result[elem.time] = {};
          result[elem.time][EXCHANGE_BASE_INTERVAL_IN_SEC] = elem;
        });

        if (intervalsTimeInSec.length != 0) {
          for (let i = 0; i < intervalsTimeInSec.length; i++) {
            const interval = intervalsTimeInSec[i];

            batch[interval] = CandleConvert.json(candledata as IOHLCV[], EXCHANGE_BASE_INTERVAL_IN_SEC, interval);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            batch[interval].map((elem: any) => {
              result[elem.time][interval] = elem;
            });
          }
        }
      }

      return result as batchedOHLCV;
    } catch (e) {
      logger.error('Batched Candlestick error', e);
    }
  }

  public async getCandlestickFromDB(
    exchange: string,
    symbol: string,
    interval: number,
    limit: number,
  ): Promise<IOHLCV[] | undefined> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rows: any = [];

      // TODO add proper support Tick Chart values
      if ([16, 32, 64, 128, 256, 512, 1024].indexOf(interval) >= 0) {
        rows = await this._getTickchartFromDB(exchange, symbol, interval, limit);

        // Sort by time asc
        rows = _.sortBy(rows, ['time']);

        return rows;
      }

      // Converted Candles
      if (interval !== EXCHANGE_BASE_INTERVAL_IN_SEC && limit !== 0) {
        // eslint-disable-next-line no-param-reassign
        limit *= interval / EXCHANGE_BASE_INTERVAL_IN_SEC;

        // Limit should be always higher than convert ratio * 1,5 + 1
        // eslint-disable-next-line no-param-reassign
        limit += (interval / EXCHANGE_BASE_INTERVAL_IN_SEC) * 1.5;
      }

      const tableName = Utils.candlestickName(exchange, symbol, EXCHANGE_BASE_INTERVAL_IN_SEC);

      [rows] = await ExchangeDB.query('SELECT * FROM ?? ORDER BY `time` DESC LIMIT ?;', [tableName, ~~limit + 1]);

      // Convert into new time frame
      if (interval !== EXCHANGE_BASE_INTERVAL_IN_SEC) {
        rows = CandleConvert.json(rows, EXCHANGE_BASE_INTERVAL_IN_SEC, interval);
      }

      // Sort by time asc
      rows = _.sortBy(rows, ['time']);

      return rows;
    } catch (e) {
      logger.error('SQL error ', e);
    }
  }

  private async _getTickchartFromDB(
    exchange: string,
    symbol: string,
    tickLength: number,
    limit: number,
    time = 0,
  ): Promise<IOHLCV[] | undefined> {
    try {
      const tableName = Utils.tradesName(exchange, symbol);

      const [rows] = await ExchangeDB.query('SELECT * FROM ?? WHERE time > ? ORDER BY `time` DESC LIMIT ?;', [
        tableName,
        time,
        limit,
      ]);

      return CandleConvert.tick_chart(rows as Trade[], tickLength);
    } catch (e) {
      logger.error('SQL error', e);
    }
  }

  public async loadAvailableTradePairs(): Promise<RowDataPacket[] | undefined> {
    try {
      const [rows] = await BaseDB.query('SELECT * FROM `tradepairs`;');

      return rows as RowDataPacket[];
    } catch (e) {
      logger.error('SQL error', e);
    }
  }
}

export default new TradePairs();
