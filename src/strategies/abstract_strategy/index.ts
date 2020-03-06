import { logger } from '../../logger';
import TAIndicators from '../../indicators';
import { OHLCV } from 'candlestick-convert';
import { OHLCVMap } from '../../types';

export class AbstractStrategy {
  intervals: number[];
  advice: any;
  tradeHistory: any;
  TA_BUFFER: {};
  TA: {};
  step: number;
  minimumPreLoadHistory: number;
  currentTrade: { priceBuy: number; priceSell: number; candlePatternSnapshot: OHLCV[] };
  candleBuffer: OHLCVMap;
  constructor() {
    this.advice = '';
    this.TA_BUFFER = {};
    this.TA = {};
    this.advice;
    this.step = -1;
    this.minimumPreLoadHistory = 100;

    this.intervals = [];

    this.candleBuffer = new Map() as OHLCVMap;

    // ML part
    this.tradeHistory = [];
    this.currentTrade = {
      priceBuy: 0,
      priceSell: 0,
      candlePatternSnapshot: [],
    };
  }

  getTaValueByLabel(label: string): any {
    return this.TA_BUFFER[label][this.step];
  }

  getTaAgeByLabel(label: string): any {
    return this.TA[label].lastUpdate;
  }

  isStrategyReady(): boolean {
    return this.step > this.minimumPreLoadHistory;
  }

  updateWithCandle(candledata: OHLCVMap): void {
    this.updateTA(candledata);
    return;
  }

  async update(candledata: OHLCVMap) {
    try {
      // Update buffers and indicators
      this.updateWithCandle(candledata);

      if (this.isStrategyReady()) {
        //
        // Strategy logic
        //
        return;
      }
    } catch (e) {
      logger.error(`Strategy update error: ${e}`);
    }
  }

  updateTA(candledata: OHLCVMap): void {
    try {
      Object.keys(candledata).forEach(interval => {
        Object.keys(this.TA).forEach(label => {
          if (Number(this.TA[label].update_interval) === Number(interval)) {
            this.TA[label].update(candledata[interval], this.step);
          }
        });
      });

      this.updateTA_BUFFER();

      return;
    } catch (e) {
      logger.error('AbstractStrategy TA Update error ', e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  updateTA_BUFFER(): void {
    Object.keys(this.TA).forEach(label => {
      this.TA_BUFFER[label].push(this.TA[label].result);
    });
    this.step++; // SUPER IMPORTANT!!!!

    return;
  }

  addNewCandleInterval(interval: number): void {
    if (this.intervals.indexOf(interval) == -1) {
      this.intervals.push(interval);
      this.candleBuffer[interval] = [];
    }
  }

  addNeWTA(config: any): void {
    try {
      const label = config.label;
      this.addNewCandleInterval(config.update_interval);

      if (typeof this.TA_BUFFER[label] == 'undefined' && typeof this.TA[label] == 'undefined') {
        this.TA[label] = new TAIndicators(config);

        this.addTA_BUFFER(label);
      }
    } catch (e) {
      logger.error('AbstractStrategy Add TA error ', e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  addTA_BUFFER(name: string): void {
    if (typeof this.TA_BUFFER[name] == 'undefined') {
      this.TA_BUFFER[name] = [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  snapshotTA_BUFFER(snapshotLength = 10): any {
    try {
      const snapshot: any = [];

      for (let k = snapshotLength; k >= 0; k--) {
        Object.keys(this.TA).forEach(label => {
          if (this.TA[label].ta_name == 'BB') {
            snapshot.push(this.TA_BUFFER[label][this.step - k].upper);
            snapshot.push(this.TA_BUFFER[label][this.step - k].lower);
          } else if (this.TA[label].ta_name == 'DONCHIAN') {
            snapshot.push(this.TA_BUFFER[label][this.step - k].min);
            snapshot.push(this.TA_BUFFER[label][this.step - k].max);
            snapshot.push(this.TA_BUFFER[label][this.step - k].middle);
          } else {
            snapshot.push(this.TA_BUFFER[label][this.step - k]);
          }
        });
      }

      return snapshot;
    } catch (e) {
      logger.error('AbstractStrategy ML_data_snapshot', e);
    }
  }

  resetCurrentTrade(): void {
    this.currentTrade = {
      candlePatternSnapshot: [],
      priceBuy: 0,
      priceSell: 0,
    };
  }

  BUY(price: number /*, amount = "all"*/): void {
    if (this.advice == 'BUY') return;

    // ML /* TODO add config! */
    this.currentTrade.priceBuy = price;
    this.currentTrade.candlePatternSnapshot = this.snapshotTA_BUFFER(7);

    this.advice = 'BUY';
  }

  SELL(price: number /*, amount = "all"*/): void {
    if (this.advice == 'SELL') return;

    if (this.currentTrade.candlePatternSnapshot.length > 0) {
      this.advice = 'SELL';

      this.currentTrade.priceSell = price;
      this.tradeHistory.push(this.currentTrade);
      this.resetCurrentTrade();
    }
  }

  IDLE(): void {
    if (this.advice == 'IDLE') return;

    this.advice = 'IDLE';
  }
}

module.exports = AbstractStrategy;
