/*
Grid bot abstract:

- should able to set unlimited grid level
- calculate with fee
- able to follow the grid instance fund
- execute trades in order

*/
import SandExchange from 'sand-ex';
import { floor } from 'lodash';

import { OHLCV, OrderStatus, OrderType, OrderSide } from 'sand-ex/build/types';

const DEFAULT_PRECISION = 8;

export type GridBotConfig = {
  priceLow: number;
  priceHigh: number;
  gridQuantity: number;
  balanceQuote: number;
  fee: number;
  precision?: number;
};

type Grid = {
  readonly priceLow: number;
  readonly priceHigh: number;
  readonly maxQuantity: number;
  ownedQuantity: number;
  activeOrderId: number | null;
};

export class GridBot {
  balanceQuote: number;
  balanceAsset: number;
  assetPerGrid: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderHistory: any[];
  grids: Grid[];
  exchange: SandExchange;
  syncedOrders: Set<number>;
  private readonly fee: number;
  private readonly precision: number;

  constructor(config: GridBotConfig) {
    this.orderHistory = [];
    this.syncedOrders = new Set();
    this.balanceQuote = config.balanceQuote;
    this.balanceAsset = 0;
    this.fee = config.fee;
    this.precision = config.precision || DEFAULT_PRECISION;

    this.exchange = new SandExchange({
      balanceAsset: this.balanceAsset,
      balanceQuote: this.balanceQuote,
      fee: this.fee,
      precision: this.precision,
    });

    const pricePerStep = (config.priceHigh - config.priceLow) / config.gridQuantity;
    const totalPriceStep = (config.gridQuantity ** 2 + config.gridQuantity) / 2; // n * n + n / 2

    this.assetPerGrid = this.balanceQuote / (config.gridQuantity * config.priceLow + totalPriceStep * pricePerStep);
    this.assetPerGrid = floor(this.assetPerGrid, DEFAULT_PRECISION);

    this.grids = [...Array(config.gridQuantity)].map((_, i) => {
      const priceLow = config.priceLow + ((config.priceHigh - config.priceLow) / config.gridQuantity) * i;
      const priceHigh = config.priceLow + ((config.priceHigh - config.priceLow) / config.gridQuantity) * (i + 1);

      const ownedQuantity = 0;

      return {
        priceLow,
        priceHigh,
        maxQuantity: this.assetPerGrid,
        ownedQuantity,
        activeOrderId: null,
      };
    });
  }

  update(candle: OHLCV): void {
    const currentPrice = candle[1];

    this.exchange.update(candle);

    // Check Orders
    this.exchange.getOrders().forEach(order => {
      if (this.syncedOrders.has(order.orderId)) {
        return;
      }

      if (order.status === OrderStatus.FILLED) {
        const grindIndex = this.grids.findIndex(grid => grid.activeOrderId === order.orderId);

        if (order.side === OrderSide.BUY) {
          const bookedQuantity = floor(order.executedQty * (1 - this.fee), this.precision);
          this.balanceAsset += bookedQuantity;
          this.balanceQuote -= order.executedQty * order.price;

          this.grids[grindIndex] = {
            ...this.grids[grindIndex],
            ...{ activeOrderId: null, ownedQuantity: bookedQuantity },
          };
        }

        if (order.side === OrderSide.SELL) {
          this.balanceQuote += order.executedQty * order.price * (1 - this.fee);
          this.balanceAsset -= order.executedQty;

          this.grids[grindIndex] = {
            ...this.grids[grindIndex],
            ...{ activeOrderId: null, ownedQuantity: 0 },
          };
        }

        this.orderHistory.push(order);
        this.syncedOrders.add(order.orderId);
      }
    });

    // Actions
    this.grids = this.grids.map(grid => {
      const { priceLow, priceHigh, ownedQuantity, maxQuantity, activeOrderId } = grid;

      // Buy
      if (currentPrice >= priceLow && activeOrderId === null && ownedQuantity === 0) {
        const requiredQuantity = maxQuantity;
        const orderInfo = this.exchange.createNewOrder({
          side: OrderSide.BUY,
          type: OrderType.LIMIT,
          price: priceLow,
          quantity: requiredQuantity,
        });

        return { ...grid, ...{ activeOrderId: orderInfo.orderId } };
      }

      // Sell
      if (currentPrice <= priceHigh && activeOrderId === null && ownedQuantity !== 0) {
        const orderInfo = this.exchange.createNewOrder({
          side: OrderSide.SELL,
          type: OrderType.LIMIT,
          price: priceHigh,
          quantity: ownedQuantity,
        });

        return { ...grid, ...{ activeOrderId: orderInfo.orderId } };
      }

      return { ...grid };
    });
  }
}
