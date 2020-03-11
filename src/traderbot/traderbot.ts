import { logger } from '../logger';
import { BaseDB } from '../database';

import { TradeInstance } from './trade_instance';
import { DEFAULT_TRADERBOT_UPDATELOOP_TIMEOUT } from '../constants';
import { RowDataPacket } from 'mysql2';

class Traderbot {
  strategyAdvices: any[];
  lastAdviceTime: any;
  tradeInstanceList: TradeInstance[];

  constructor() {
    this.strategyAdvices = [];
    this.tradeInstanceList = [];
  }

  async start(): Promise<void> {
    try {
      // Update trade advice timer
      this.lastAdviceTime = await this.getLastAdviceTimeFromDB();

      // Load/Reload instances
      await this.loadTradeInstances();

      // Start update loop
      await this.updateLoop();
    } catch (e) {
      logger.error('Traderbot start error!', e);
    }
  }

  async updateLoop(): Promise<void> {
    try {
      await this.updateTradeBotInstanceList();
      await this.loadTradeInstances();
    } catch (e) {
      logger.error('Traderbot update loop error!', e);
    } finally {
      setTimeout(() => {
        this.updateLoop();
      }, DEFAULT_TRADERBOT_UPDATELOOP_TIMEOUT);
    }
  }

  async loadTradeInstances(): Promise<void> {
    try {
      // Only load new instances, re-load is not an option anymore
      let instances = await this.loadTradeInstanceListFromDB();

      if (!instances) {
        return;
      }

      if (this.tradeInstanceList) {
        const oldInstanceIDs = this.tradeInstanceList.map((e: TradeInstance) => e.instanceID);

        instances = instances.filter(e => oldInstanceIDs.indexOf(e.guid) === -1);
      }

      instances.forEach(e => {
        const newTradeInstance = new TradeInstance({
          exchange: e.exchange,
          orderLimit: e.orderLimit,
          instanceID: e.guid,
          strategyGuid: e.strategyGuid,
          symbol: e.symbol,
          asset: e.asset,
          quote: e.quote,
          balanceAsset: e.balanceAsset,
          balanceQuote: e.balanceQuote,
          orderBalanceAsset: e.orderBalanceAsset,
          orderBalanceQuote: e.orderBalanceQuote,
        });

        this.tradeInstanceList.push(newTradeInstance);
        logger.verbose(`Tradebot new instances loaded, guid: ${e.strategyGuid}`);
      });

      return;
    } catch (e) {
      logger.error('Tradebot error!', e);
    }
  }

  async updateTradeBotInstanceList(): Promise<void> {
    try {
      // Get fresh Advices from DB

      this.strategyAdvices = (await this.getTradeAdviceFromDB(this.lastAdviceTime)) as RowDataPacket[];

      logger.verbose(`Trade advice length: ${this.strategyAdvices.length} Last advice time: ${this.lastAdviceTime}`);

      // New advices
      if (this.strategyAdvices.length != 0) {
        // Update Trade instances
        for (const traderInstance of this.tradeInstanceList) {
          const strategyAdvice = this.strategyAdvices.find(elem => elem.strategyGuid == traderInstance.strategyGuid);

          // Update Trader instances
          if (strategyAdvice) {
            traderInstance.update(strategyAdvice);
          }
        }
      }

      logger.verbose(`Tradebot instances updated, count: ${this.tradeInstanceList.length}`);

      // Update advice time to avoid double actions
      this.lastAdviceTime = await this.getLastAdviceTimeFromDB();
    } catch (e) {
      logger.error('Traderbot Trade Error', e);
    }
  }

  async loadTradeInstanceListFromDB(): Promise<RowDataPacket[] | undefined> {
    try {
      const [rows] = await BaseDB.query('SELECT * FROM `account_trader_instances`;');

      return rows as RowDataPacket[];
    } catch (e) {
      logger.error('SQL error', e);
    }
  }

  async getTradeAdviceFromDB(time = 0): Promise<RowDataPacket[] | undefined> {
    try {
      const [
        rows,
      ] = await BaseDB.query(
        'SELECT DISTINCT `trade_advice`.`symbol`, `trade_advice`.`exchange`, `trade_advice`.`strategy_guid`, `trade_advice`.`strategy`, `trade_advice`.`strategy_config`, `action`,  trade_advice.`time`, `asset`, `quote`, `close` FROM `trade_advice` JOIN tradepairs ON trade_advice.symbol = tradepairs.symbol WHERE trade_advice.time > ? ORDER BY trade_advice.`time` DESC;',
        [time],
      );

      return rows as RowDataPacket[];
    } catch (e) {
      logger.error('SQL error', e);
    }
  }

  async getLastAdviceTimeFromDB(): Promise<number | undefined> {
    try {
      const [rows] = await BaseDB.query('SELECT time FROM `trade_advice` ORDER BY `trade_advice`.`time` DESC LIMIT 1;');

      if (rows && rows[0]?.time) {
        return rows[0].time;
      }

      return Date.now();
    } catch (e) {
      logger.error('SQL error', e);
    }
  }
}

export default new Traderbot();
