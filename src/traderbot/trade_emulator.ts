import { logger } from '../logger';
import { Utils } from '../utils';
import { TradeEmulatorConfig, AdviceSchema, OrderSchema, createOrderSchema } from '../types';
import { OHLCV } from 'candlestick-convert';

export class TradeEmulator {
  orders: any[];
  balanceAsset: any;
  balanceQuote: any;
  fee: any;
  stopLossLimit: any;
  trailingLimit: any;
  portionPct: any;
  orderSize: number;
  historyOrders: OrderSchema[];
  price: number;
  constructor(config: TradeEmulatorConfig) {
    this.balanceAsset = config.balanceAsset || 0;
    this.balanceQuote = config.balanceQuote || 1000;
    this.fee = config.fee || 0.001;
    this.stopLossLimit = config.stopLossLimit || 0.9; // -1 disable
    this.trailingLimit = config.trailingLimit || 0.01; // -1 disable
    this.portionPct = config.portionPct || 10;

    this.orderSize = (this.balanceQuote / 100) * this.portionPct;

    this.orders = [];
    this.historyOrders = [];

    this.price = -1;
  }

  action(advice: AdviceSchema): void {
    try {
      /*{
          action:
          price:
          time:
        }*/

      if (advice.action == 'BUY') {
        this.buy(advice.price, advice.time);
      } else if (advice.action == 'SELL') {
        this.sell(advice.price, advice.time);
      }

      return;
    } catch (e) {
      logger.error('TradeEmulator action error ', e);
    }
  }

  sell(price: number, time: number): void {
    try {
      this.orders = this.orders.map(order => {
        if (order.closed == 0) {
          this.balanceQuote += (order.quantity * price) / (1 + this.fee * 2);
          this.balanceAsset -= order.quantity;

          this.historyOrders.push(order);

          order.sold = price;
          order.closed = time;
          order.closeType = 'Sell';
          order.balance = this.getFullBalance();
        }

        return;
      });
    } catch (e) {
      logger.error('Trade emulator Sell error ', e);
    }
  }

  buy(price: number, time: number): void {
    try {
      if (this.balanceQuote < this.orderSize) {
        return;
      }

      this.createOrder({
        type: 'BUY',
        time,
        price,
        size: this.orderSize,
        stopLossLimit: this.stopLossLimit,
        trailingLimit: this.trailingLimit,
      });

      return;
    } catch (e) {
      logger.error('Trade emulator Buy error ', e);
    }
  }

  createOrder(config: createOrderSchema): void {
    try {
      let quantity = config.size;

      if (config.type == 'BUY') {
        quantity = Utils.buyQuantityBySymbol(config.size, config.price);
      }

      let stopLossPrice = 0;
      let trailingPrice = 0;
      let trailingLimit = 0;

      if (config.stopLossLimit > 0) {
        stopLossPrice = config.price * config.stopLossLimit;
      }

      if (config.trailingLimit > 0) {
        trailingPrice = config.price + config.price * config.trailingLimit * 2;
        trailingLimit = config.trailingLimit;
      }

      const order = {
        price: config.price,
        time: config.time,
        quantity,
        stopLossPrice,
        trailingPrice,
        trailingLimit,
        closed: 0,
        balance: this.getFullBalance(),
      };

      this.orders.push(order);

      if (config.type == 'BUY') {
        this.balanceQuote -= config.size;
        this.balanceAsset += quantity;
      }

      return;
    } catch (e) {
      logger.error('Trade emulator createOrder error ', e);
    }
  }

  update(candle: OHLCV): OrderSchema | undefined {
    try {
      this.price = candle.close;

      this.orders = this.orders.map(order => {
        if (order.stopLossPrice > 0 && order.stopLossPrice >= this.price && order.closed == 0) {
          this.balanceQuote += (order.quantity * this.price) / (1 + this.fee * 2);
          this.balanceAsset -= order.quantity;

          this.historyOrders.push(order);

          order.sold = this.price;
          order.closed = candle.time;
          order.closeType = 'Stop-loss';
          order.balance = this.getFullBalance();
        }

        if (order.trailingLimit > 0 && this.price >= order.trailingPrice && order.closed == 0) {
          order.stopLossPrice = this.price - this.price * order.trailingLimit;
          order.trailingPrice = this.price + this.price * order.trailingLimit;
        }

        return order;
      });

      return;
    } catch (e) {
      logger.error('Trade emulator update error ', e);
    }
  }

  getFullBalance(): number {
    this.orderSize = (this.balanceQuote / 100) * this.portionPct;
    return this.balanceQuote + this.balanceAsset * this.price;
  }
}
