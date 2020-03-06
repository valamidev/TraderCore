import { logger } from '../logger';
import { TradeEmulator } from '../traderbot/trade_emulator';
import { EmulatorConfig, batchedOHLCV, OHLCVMapFlat } from '../types';
import { AbstractStrategy } from '../strategies/abstract_strategy';
import { EmulatorStates } from '../constants';

export class Emulator {
  intervals: number[];
  config: EmulatorConfig;
  strategy: AbstractStrategy;
  lastAdvice: any;
  lastAction: any;
  nextAction: any;
  lastUpdateTime: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastUpdate?: OHLCVMapFlat;
  actionList: unknown[];
  TradeEmulator: TradeEmulator | undefined;
  backtest: number;
  state: EmulatorStates;
  balanceQuote: any;

  constructor(config: EmulatorConfig) {
    this.config = config;

    this.strategy = new (require('../strategies/' + this.config.strategy + '/'))(this.config.strategyConfig);
    this.intervals = this.strategy.intervals;

    this.lastAdvice;
    this.lastAction;
    this.nextAction;
    this.lastUpdateTime = 0;

    this.actionList = [];

    this.backtest = 0;

    if (this.config.traderConfig) {
      this.TradeEmulator = new TradeEmulator(this.config.traderConfig);
      this.backtest = 1;
    }

    this.state = EmulatorStates.LOADED;
  }

  async start(candledata: batchedOHLCV): Promise<void> {
    try {
      // Hot-start strategy
      await this.update(candledata);

      this.state = EmulatorStates.READY;

      return;
    } catch (e) {
      logger.error('Emulator error ', e);
    }
  }

  // Price ticker update / Cannot be used for back testing!
  async updatePrice(): Promise<void> {
    return;
  }

  // Candledata / Orderbook update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(candledata: batchedOHLCV, _orderbook?: any): Promise<number | undefined> {
    try {
      let updateTick = 0;

      const updateTimeStamps = Object.keys(candledata);

      for (const timeStamp of updateTimeStamps) {
        // Strategy update!

        await this.strategy.update(candledata[timeStamp]);

        // Strategy update!

        if (this.TradeEmulator) {
          // Price update
          this.TradeEmulator.update(candledata[timeStamp][60]);
        }

        if (this.nextAction !== this.lastAction) {
          if (this.TradeEmulator) {
            this.TradeEmulator.action({ action: this.nextAction, price: candledata[timeStamp][60].open, time: candledata[timeStamp][60].time });
          }

          this.lastAction = this.nextAction;
        }

        if (this.strategy.advice !== this.lastAdvice) {
          this.nextAction = this.strategy.advice;

          this.lastAdvice = this.strategy.advice;
        }

        // Set last update time avoid multiple update
        this.lastUpdateTime = parseInt(timeStamp);
        this.lastUpdate = candledata[timeStamp];
        updateTick++;
      }

      return updateTick as number;
    } catch (e) {
      logger.error('Emulator error ', e);
    }
  }
}
