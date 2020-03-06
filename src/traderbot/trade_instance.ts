import { tradeUtils } from './trade_utils';
import { Utils } from '../utils';
import { logger } from '../logger';

import ccxtController from '../exchange/ccxt_controller';
import { TradeInstanceConfig, AdviceSchema, ExchangeOrderInfoSchema } from '../types';

// const fee = 1.001

const TOTAL_BALLANCE = 'ALL';

export class TradeInstance {
  instanceID: number;
  symbol: string;
  asset: string;
  quote: string;
  balanceAsset: number;
  balanceQuote: number;
  orderBalanceAsset: number;
  orderBalanceQuote: number;
  strategyGuid: number;
  orderLimit: number;
  exchange: string;
  exchangeAPI: any;
  constructor(config: TradeInstanceConfig) {
    //   Config parse
    this.instanceID = config.instanceID;
    this.symbol = config.symbol;
    this.asset = config.asset;
    this.quote = config.quote;
    this.balanceAsset = config.balanceAsset;
    this.balanceQuote = config.balanceQuote;
    this.orderBalanceAsset = config.orderBalanceAsset;
    this.orderBalanceQuote = config.orderBalanceQuote;

    this.strategyGuid = config.strategyGuid;
    this.orderLimit = config.orderLimit;
    this.exchange = config.exchange;

    //   Config parse

    // WARNING EVERY FIELD SYNCED FROM DATABASE DO NOT USE ANY NON DB LOADED VARIABLE!
    // Load Exchange API
    this.exchangeAPI = ccxtController.loadExchangeAPI(this.exchange);
  }

  async update(advice: AdviceSchema): Promise<void> {
    try {
      logger.info(`Trade instance update ${advice.action} , ${advice.close}`);

      // Check values
      if (advice.action !== undefined && advice.close !== undefined) {
        // All in trades can have undefined or 0 quantities
        if (typeof advice.quantity == 'undefined') {
          advice.quantity = 0;
        }

        const quantity = advice.quantity ?? TOTAL_BALLANCE;

        if (advice.action == 'BUY') {
          await this.buy(advice.close, quantity);
        } else if (advice.action == 'SELL') {
          await this.sell(advice.close, quantity);
        }
      }

      await this.checkOrder();

      return;
    } catch (e) {
      logger.error('Trade instance error ', e);
    }
  }

  async sell(price: number, quantity: number | string): Promise<void> {
    try {
      // If quantity is not set use Asset Balance
      if (quantity === 0 || quantity === TOTAL_BALLANCE) {
        quantity = this.balanceAsset;
      }

      logger.info(`SYMBOL: ${this.symbol} SELL QUANTITY: ${quantity}`);

      if (typeof quantity === 'number' && quantity > 0 && this.balanceAsset - quantity < 0) {
        const response = await this.exchangeAPI.create_limit_sell_order(this.symbol, quantity, price);

        if (response) {
          await tradeUtils.insertAccountOrdersToDB(response, this.instanceID);

          /*
          this.balanceAsset 
          this.balanceQuote 
          this.orderBalanceAsset 
          this.orderBalanceQuote
          */

          this.balanceAsset -= response.amount;
          this.orderBalanceAsset += response.amount;

          await this.syncTradeInstanceBalance();
        }
      }
    } catch (e) {
      logger.error('Trade instance error sell ', e);
    }
  }

  async buy(price: number, quoteLimit: number | string): Promise<void> {
    try {
      if (quoteLimit === 0 || quoteLimit === TOTAL_BALLANCE) {
        quoteLimit = this.balanceQuote;
      }

      if (typeof quoteLimit === 'number') {
        // Calculate quantity
        const quantity = quoteLimit >= this.balanceQuote ? Utils.buyQuantityBySymbol(this.balanceQuote, price) : Utils.buyQuantityBySymbol(quoteLimit, price);
        // Round quantity

        logger.info(`SYMBOL: ${this.symbol} BUY QUANTITY: ${quantity}`);

        if (quantity > 0 || this.balanceQuote - quoteLimit < 0) {
          const response = await this.exchangeAPI.create_limit_buy_order(this.symbol, quantity, price);

          if (response) {
            await tradeUtils.insertAccountOrdersToDB(response, this.instanceID);

            /*
          this.balanceAsset 
          this.balanceQuote 
          this.orderBalanceAsset 
          this.orderBalanceQuote
          */

            this.balanceQuote -= response.amount * response.price;
            this.orderBalanceQuote += response.amount * response.price;

            await this.syncTradeInstanceBalance();
          }
        }
      }
    } catch (e) {
      logger.error('Trade instance error ', e);
    }
  }

  async syncTradeInstanceBalance(): Promise<void> {
    try {
      /*
      this.balanceAsset 
      this.balanceQuote 
      this.orderBalanceAsset 
      this.orderBalanceQuote
      */
      await tradeUtils.setTradeInstanceBalance(this.instanceID, this.balanceAsset, this.balanceQuote, this.orderBalanceAsset, this.orderBalanceQuote);
    } catch (e) {
      logger.error('Trade instance sync balance error ', e);
    }
  }

  async checkOrder(): Promise<void> {
    try {
      const order = await tradeUtils.getLastTradesByInstanceToDB(this.instanceID);

      if (order) {
        order.forEach(async order => {
          const orderInfo = await this.exchangeAPI.fetchOrder(order.id, order.symbol);

          logger.verbose(orderInfo);

          /*
          info: {}
          type: 'limit',
          side: 'sell',
          price: 0.0003186,
          amount: 3.13,
          cost: 0.00099721,
          average: 0.00031859744408945683,
          filled: 3.13,
          remaining: 1,
          status: 'open', / 'closed', / 'canceled'
        */

          if (orderInfo.status == 'open') {
            logger.verbose(`Open order ${orderInfo.id} , ${orderInfo.amount}/${orderInfo.filled} , ${orderInfo.price}`);
          }

          if (orderInfo.status == 'closed') {
            logger.verbose(`Order filled ${orderInfo.id} , ${orderInfo.filled} , ${orderInfo.price}`);

            await this.bookTradeInstanceOrder(orderInfo);
          }

          if (orderInfo.status == 'canceled') {
            await this.bookTradeInstanceOrder(orderInfo);
          }
        });
      }
    } catch (e) {
      logger.error('Trade instance order check error ', e);
    }
  }

  async bookTradeInstanceOrder(orderInfo: ExchangeOrderInfoSchema): Promise<void> {
    /*
      this.balanceAsset 
      this.balanceQuote 
      this.orderBalanceAsset 
      this.orderBalanceQuote
      */

    if (orderInfo.side == 'sell') {
      // Add non sold assets to the balance
      this.balanceAsset += orderInfo.remaining;
      // Remove order assets from the order asset balance
      this.orderBalanceAsset -= orderInfo.amount;
      // Add quotes gain after sold assets into the quote balance
      this.balanceQuote += orderInfo.cost;
    }

    if (orderInfo.side == 'buy') {
      // Add non spent quotes back to balance
      this.balanceQuote += orderInfo.remaining * orderInfo.price;
      // Remove quotes from the order quote balance
      this.orderBalanceQuote -= orderInfo.amount * orderInfo.price;
      // Add assets bought from order
      this.balanceAsset += orderInfo.filled;
    }

    // Avoid negative Order balance
    if (this.orderBalanceAsset < 0) this.orderBalanceAsset = 0;
    if (this.orderBalanceQuote < 0) this.orderBalanceQuote = 0;

    await this.syncTradeInstanceBalance();
    await tradeUtils.closeAccountTradesDB(orderInfo.id);
  }
  // End of class
}
