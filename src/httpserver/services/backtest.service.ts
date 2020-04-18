import { Injectable } from '@nestjs/common';

import _ from 'lodash';

import { StrategyOptimizer } from '../../emulator/strategy_optimizer';
import { DEFAULT_STRATEGY_OPTIMIZER_INTERVALS, DEFAULT_TRADER_CONFIG } from '../../constants';
import tradePairs from '../../tradepairs/tradepairs';

export type OptimizeConfig = {
  exchange: string;
  symbol: string;
  strategy: string;
  candleLimit: number;
  numberOfExecution: number;
};

@Injectable()
export class BacktestService {
  async optimize(config: OptimizeConfig): Promise<any> {
    const exchange = config.exchange ?? 'binance';
    const symbol = config.symbol ?? 'BTC/USDT';
    const strategy = config.strategy ?? 'bb_pure';
    const candleLimit = Number(config.candleLimit) || 3000;
    const numberOfExecution = Number(config.numberOfExecution) || 10;

    const candleData = await tradePairs.getBatchedCandlestickMap(
      exchange,
      symbol,
      DEFAULT_STRATEGY_OPTIMIZER_INTERVALS,
      candleLimit,
    );

    if (candleData) {
      // Strategy optimizer, helper function
      const optimizer = new StrategyOptimizer({
        exchange,
        symbol,
        numberOfExecution,
        strategy,
        traderConfig: DEFAULT_TRADER_CONFIG,
        candledata: candleData,
      });

      const optimizerResult = await optimizer.execute();

      const candleDataForChart = Object.keys(candleData)
        .map((time): any => {
          return candleData[time][300];
        })
        .filter(elem => elem !== undefined);

      const response = {
        testResults: _.reverse(optimizerResult),
        candledata: candleDataForChart,
      };

      return response;
    }
  }
}
