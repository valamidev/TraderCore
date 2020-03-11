import { logger } from '../logger';
import _ from 'lodash';
import * as ccxt from 'ccxt';

import * as ccxtConfig from '../../ccxt_config.json';

class ExchangeAPI {
  exchanges: any[];
  constructor() {
    this.exchanges = [];
  }

  /* CCXT API STUFF */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadExchangeAPI(exchange: string): any {
    try {
      exchange = exchange.toLowerCase();

      // Check if CCXT API already loaded
      let exchangeData = this.exchanges.find(e => e.exchange == exchange);

      // CCTX API load from buffer or add to the buffer
      if (!exchangeData) {
        exchangeData = this.initNewExchanges(exchange);
      }

      return exchangeData.api;
    } catch (e) {
      logger.error('CCXT load API error ', e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initNewExchanges(exchange: string): any {
    exchange = exchange.toLowerCase();

    const config = ccxtConfig[exchange];

    // Check exchange is valid
    if (_.isObject(ccxt[exchange]) && _.isObject(config)) {
      // Create new exchange with config
      const api = new ccxt[exchange](config);

      this.exchanges.push({ exchange, api });

      return { exchange, api };
    } else {
      throw new Error(`Invalid Exchange ${exchange}`);
    }
  }

  /* CCXT API STUFF */
}

export default new ExchangeAPI();
