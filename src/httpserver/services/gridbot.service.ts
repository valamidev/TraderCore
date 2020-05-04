import { Injectable } from '@nestjs/common';
import { OHLCV } from 'sand-ex/build/types';
import _ from 'lodash';

import tradePairs from '../../tradepairs/tradepairs';
import { GridBotConfig, GridBot } from '../../grid_bot';

@Injectable()
export class GridbotService {
  async backtest(config: any): Promise<any> {
    const exchange = 'binance';
    const symbol = 'BTC/USDT';
    const candleLimit = 1440 * 30;

    const candleData = await tradePairs.getCandlestickFromDB(exchange, symbol, 60, candleLimit);

    if (candleData) {
      const candleSticks = candleData.map(c => [c.time, c.open, c.high, c.low, c.close, c.volume]);

      // Strategy optimizer, helper function
      const gridBotConfig: GridBotConfig = {
        priceLow: 7500,
        priceHigh: 10000,
        gridQuantity: 8,
        balanceQuote: 10000,
        fee: 0.00075, // 0.0075% / 100,
      };

      const gridBot = new GridBot(gridBotConfig);

      console.log(candleSticks.length);

      for (let i = 0; i < candleSticks.length; i++) {
        gridBot.update((candleSticks[i] as unknown) as OHLCV);
      }

      console.log(gridBot.exchange.getOrders().length);

      console.log(gridBot.balanceAsset);
      console.log(gridBot.balanceQuote + gridBot.balanceAsset * candleSticks[candleSticks.length - 1][4]);

      return '';
    }
  }
}
