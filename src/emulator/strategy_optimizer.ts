import _ from 'lodash';
import { logger } from '../logger';
import tradePairs from '../tradepairs/tradepairs';
import { BacktestEmulator } from './backtest_emulator';
import strategies from '../strategies/index';
import { StrategyOptimizerConfig, batchedOHLCV } from '../types';
import { DEFAULT_STRATEGY_OPTIMIZER_INTERVALS } from '../constants';

export class StrategyOptimizer {
  candledata: batchedOHLCV;
  config: StrategyOptimizerConfig;
  constructor(config: StrategyOptimizerConfig) {
    this.config = config;
    this.candledata = new Map();
  }

  loadStrategyConfigSchema(name: string): unknown | undefined {
    const strategyInfo = strategies.find(elem => elem.name === name);

    if (strategyInfo?.config) {
      return strategyInfo.config;
    } else {
      throw new Error(`Strategy config schema not exist, for strategy: ${name} `);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strategyConfigRandomizer(config: any): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newConfig: any = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(config).forEach((elem: any) => {
      /* 
     elem[1][0] = min 
     elem[1][1]elem[1] = max 
     elem[1][2] = type 
     elem[1][3] = round (if type == float) */

      let value = elem[1][0] + (elem[1][1] - elem[1][0]) * Math.random();

      if (elem[1][2] === 'float') {
        value = _.round(value, elem[1][3]);
      }

      if (elem[1][2] === 'int') {
        value = parseInt(value, elem[1][3]);
      }

      newConfig[elem[0]] = value;

      return;
    });

    return newConfig;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(): Promise<any> {
    try {
      const responses = [];
      const promises: Array<Promise<void>> = [];
      const backtestEmulatorList = [];
      const backtestStrategyConfig = [];
      const baseStrategyConfig = this.loadStrategyConfigSchema(this.config.strategy);

      // Load default intervals
      const intervals = DEFAULT_STRATEGY_OPTIMIZER_INTERVALS;

      this.candledata = (await tradePairs.getBatchedCandlestickMap(this.config.exchange, this.config.symbol, intervals, this.config.candleLimit)) as batchedOHLCV;

      for (let i = 0; i < this.config.numberOfExecution; i++) {
        backtestEmulatorList[i] = new BacktestEmulator();

        // Create randomized config
        backtestStrategyConfig[i] = this.strategyConfigRandomizer(baseStrategyConfig);

        promises.push(
          backtestEmulatorList[i].start({
            symbol: this.config.symbol,
            exchange: this.config.exchange,
            strategy: this.config.strategy,
            strategyConfig: backtestStrategyConfig[i],
            traderConfig: this.config.traderConfig,
            candledata: this.candledata,
            intervals,
          }),
        );
      }

      await Promise.all(promises);

      for (let i = 0; i < this.config.numberOfExecution; i++) {
        responses.push({
          strategy: this.config.strategy,
          candleLimit: this.config.candleLimit,
          config: backtestStrategyConfig[i],
          actions: backtestEmulatorList[i].actions,
          performance: backtestEmulatorList[i].performance,
          numActions: backtestEmulatorList[i].actions[0].length,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          sumPerformance: _.sumBy(backtestEmulatorList[i].performance, 2),
        });
      }

      return _.orderBy(responses, ['sumPerformance']);
    } catch (e) {
      logger.error('Strategy StrategyOptimizer error ', e);
    }
  }
}
