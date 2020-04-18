import { logger } from '../logger';
import _ from 'lodash';
import tradePairs from '../tradepairs/tradepairs';
import { Emulator } from './emulator';
import { BaseDB } from '../database';
import { RowDataPacket } from 'mysql2';
import { LiveSimulation } from '../types';
import { DEFAULT_LIVE_STRATEGY_HOT_START_CANDLE_SIZE } from '../constants';

class LiveEmulator {
  simulations: LiveSimulation[];
  performance: any[];
  constructor() {
    this.simulations = [];
    this.performance = [];
  }

  // Load all strategies
  async start(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.simulations = (await this.loadStrategiesFromDB()) as LiveSimulation[];

      const promises = [];

      for (const simulation of this.simulations) {
        const candledata = await tradePairs.getBatchedCandlestickMap(simulation.exchange, simulation.symbol, simulation.intervals, DEFAULT_LIVE_STRATEGY_HOT_START_CANDLE_SIZE);

        simulation.emulator = new Emulator(simulation);

        if (candledata && simulation.emulator) {
          promises.push(simulation.emulator.start(candledata));
        }
      }

      await Promise.all(promises);

      logger.info(`Live emulators started, count: ${this.simulations.length}`);

      // Set update loop every 5 sec
      setInterval(async () => {
        await this.updateLoop();
      }, 5000);
      // Set update loop every 5 sec
    } catch (e) {
      logger.error('Live Emulator start error ', e);
    }
  }

  async reloadStrategiesFromDB(): Promise<void> {
    try {
      // Only add new strategies never delete old ones avoid overwrites /* TODO it need an other level of abstraction */
      const promises = [];
      const allSimulations = (await this.loadStrategiesFromDB()) as LiveSimulation[];
      let count = 0;

      for (const newSimulation of allSimulations) {
        // If this -1 strategy is not loaded (new)
        if (_.findIndex(this.simulations, { guid: newSimulation.guid }) == -1) {
          const candledata = await tradePairs.getBatchedCandlestickMap(
            newSimulation.exchange,
            newSimulation.symbol,
            newSimulation.intervals,
            DEFAULT_LIVE_STRATEGY_HOT_START_CANDLE_SIZE,
          );

          this.simulations.push(newSimulation);

          const currentIndex = this.simulations.length - 1;

          this.simulations[currentIndex].emulator = new Emulator(this.simulations[currentIndex]);

          this.simulations[currentIndex].firstAdvice = true;

          if (candledata) {
            promises.push(this.simulations[currentIndex].emulator?.start(candledata));
          }

          count++;
        }
      }

      if (count > 0) {
        await Promise.all(promises);
        logger.verbose(`New live strategy(s) loaded count : ${count}`);
      }
    } catch (e) {
      logger.error('Live Emulator reload error ', e);
    }
  }

  /* Mass update on all strategy  */
  async updateLoop(): Promise<void> {
    try {
      const promises = [];
      const time = Date.now();

      for (let i = 0; i < this.simulations.length; i++) {
        promises.push(this.updateSingle(i));
      }

      await Promise.all(promises);

      logger.verbose(`Live strategies updated, count: ${this.simulations.length} , time: ${time} lastCandleUpdate: ${this.simulations[0]?.emulator?.lastUpdate || 'undefined'} `);

      this.reloadStrategiesFromDB();

      return;
    } catch (e) {
      logger.error('Live Emulator update loop error ', e);
    }
  }

  /* Helper function for Update loop */
  async updateSingle(strategiesId: number): Promise<void> {
    try {
      const simulation = this.simulations[strategiesId];

      // Be sure that emulator is Ready for update
      if (simulation?.emulator?.state != 'Ready') {
        return;
      }

      const candledata = await tradePairs.getBatchedCandlestickMap(simulation.exchange, simulation.symbol, simulation.intervals, 10);

      // Get count of the updated candledatas
      if (!candledata) {
        return;
      }

      const updateTick = (await simulation.emulator?.update(candledata)) as number;

      // Validate that strategy got updated
      if (updateTick > 0) {
        // Save new advice otherwise Idle
        if (simulation.emulator?.lastAdvice !== simulation.lastAdvice) {
          simulation.lastAdvice = simulation.emulator.lastAdvice;
          // Do not save first advice after load solve problem when restart advice buy/sell
          if (simulation.firstAdvice == false) {
            this.saveAdviceToDB(simulation, simulation.emulator.lastAdvice);
          } else {
            simulation.firstAdvice = true;
          }
        } else {
          this.saveAdviceToDB(simulation, 'IDLE');
        }
      }
    } catch (e) {
      logger.error('Live Emulator single update error ', e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStrategiesPerformance(): any {
    return (this.performance = this.simulations.map(simulation => [
      {
        symbol: simulation.symbol,
        exchange: simulation.exchange,
        config: simulation.strategyConfig,
        virtualBalance: simulation.emulator?.balanceQuote || 0,
        tradeHistory: simulation.emulator?.actionList || [],
      },
    ]));
  }

  async loadStrategiesFromDB(): Promise<LiveSimulation[] | undefined> {
    try {
      const [rows] = await BaseDB.query('SELECT `guid`,`symbol`,`exchange`,`strategy`,`strategy_config`,`interval_sec` FROM `trade_strategies` ORDER BY `guid` ASC;');

      if (rows) {
        return (rows as RowDataPacket[]).map((elem: any) => ({
          exchange: elem.exchange,
          symbol: elem.symbol,
          strategy: elem.strategy,
          strategyConfig: elem.strategy_config,
          intervals: elem.interval_sec as number[],
        })) as LiveSimulation[];
      }
    } catch (e) {
      logger.error('SQL error', e);
    }
  }

  async saveAdviceToDB(simulation: LiveSimulation, action: string): Promise<void> {
    try {
      await BaseDB.query(
        'INSERT INTO `trade_advice` (`strategy`, `strategy_guid`, `strategy_config`, `symbol`, `exchange`, `action` , `time`, `close`  ) VALUES (?, ?,? ,? ,? ,? ,? , ?);',
        [
          simulation.strategy,
          simulation.guid,
          JSON.stringify(simulation.strategyConfig), // JSON
          simulation.symbol,
          simulation.exchange,
          action,
          simulation.emulator.lastUpdateTime ?? 0,
          simulation.emulator.lastUpdate?.['60'].close ?? 0,
        ],
      );

      return;
    } catch (e) {
      logger.error('SQL error', e);
    }
  }
}

export default new LiveEmulator();
