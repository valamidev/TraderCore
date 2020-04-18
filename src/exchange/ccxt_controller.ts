import _ from 'lodash';
import * as ccxt from 'ccxt';
import { logger } from '../logger';

import * as ccxtConfig from '../../ccxt_config.json';

class ExchangeAPI {
  exchanges: any[];
  constructor() {
    this.exchanges = [];
  }

  /* CCXT API STUFF */
  _isExchangeLoaded(exchange: string): boolean {
    const exchangeName = exchange.toLowerCase();

    if (this.exchanges.find(e => e.exchangeName === exchangeName)) {
      return true;
    }

    return false;
  }

  loadExchangeAPI(exchange: string): any {
    try {
      const exchangeName = exchange.toLowerCase();

      // Check if CCXT API already loaded
      const exchangeData = this.exchanges.find(e => e.exchangeName === exchangeName);

      if (exchangeData?.api) {
        return exchangeData.api;
      }

      return this.initNewExchanges(exchangeName).api;
    } catch (e) {
      logger.error('CCXT load API error ', e);
    }
  }

  initNewExchanges(exchange: string): any {
    const exchangeName = exchange.toLowerCase();

    const config = ccxtConfig[exchange];

    if (_.isObject(ccxt[exchangeName]) && _.isObject(config)) {
      const api = new ccxt[exchangeName](config);

      if (!this._isExchangeLoaded(exchange)) {
        this.exchanges.push({ exchangeName, api });
      }

      return { exchangeName, api };
    }
    throw new Error(`Invalid Exchange ${exchangeName}`);
  }

  /* CCXT API STUFF */
}

export default new ExchangeAPI();
