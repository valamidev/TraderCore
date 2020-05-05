import { Injectable } from '@nestjs/common';
import { OHLCV } from 'sand-ex/build/types';
// import _ from 'lodash';

import tradePairs from '../../tradepairs/tradepairs';
import { GridBotConfig, GridBot } from '../../grid_bot';

export interface GridbotConfig {
  exchange: string;
  symbol: string;
  priceLow: number;
  priceHigh: number;
  gridQuantity: number;
  fee: number;
  rangeInDays: number;
}

@Injectable()
export class GridbotService {
  async backtest(gridbotConfig: GridbotConfig): Promise<any> {
    const exchange = gridbotConfig.exchange ?? 'binance';
    const symbol = gridbotConfig.symbol ?? 'BTC/USDT';
    const { rangeInDays, priceLow, priceHigh, gridQuantity } = gridbotConfig;
    const fee = gridbotConfig.fee ?? 0.00075; // 0.0075% / 100,

    const candleLimit = 1440 * rangeInDays;

    const testQuote = 100000;

    const candleData = await tradePairs.getCandlestickFromDB(exchange, symbol, 60, candleLimit);

    if (candleData) {
      const candleSticks = candleData.map(c => [c.time, c.open, c.high, c.low, c.close, c.volume]);

      // Strategy optimizer, helper function
      const gridBotConfig: GridBotConfig = {
        priceLow,
        priceHigh,
        gridQuantity,
        balanceQuote: testQuote,
        fee,
      };

      const gridBot = new GridBot(gridBotConfig);

      const profits = [];

      for (let i = 0; i < candleSticks.length; i++) {
        gridBot.update((candleSticks[i] as unknown) as OHLCV);

        profits.push(gridBot.balanceQuote + gridBot.balanceAsset * candleSticks[candleSticks.length - 1][4]);
      }

      const totalEndBalance = gridBot.balanceQuote + gridBot.balanceAsset * candleSticks[candleSticks.length - 1][4];

      return {
        balanceAsset: gridBot.balanceAsset,
        balanceQuote: gridBot.balanceQuote,
        totalEndBalance,
        profitPct: (totalEndBalance / 100000 - 1) * 100,
        orderHistory: gridBot.orderHistory,
      };
    }
  }
}
