import { GridBot, GridBotConfig } from '../../grid_bot';
import candleData from '../fixtures/candleOHLCV';
import { OHLCV } from 'sand-ex/build/types';

const FEE = 0.00075; // 0.0075% / 100

const gridBotConfig: GridBotConfig = {
  priceLow: 9950,
  priceHigh: 10050,
  gridQuantity: 4,
  balanceQuote: 1000,
  fee: FEE,
};

const gridBotPerfect: GridBotConfig = {
  priceLow: 9000,
  priceHigh: 11000,
  gridQuantity: 4,
  balanceQuote: 1000,
  fee: FEE,
};

const perfectUpTrendChart = [
  [1, 9000, 9000, 9000, 9000, 100],
  [2, 9000, 9000, 9000, 9000, 100],
  [3, 9500, 9500, 9500, 9500, 100],
  [4, 9500, 9500, 9500, 9500, 100],
  [5, 10000, 10000, 10000, 10000, 100],
  [6, 10000, 10000, 10000, 10000, 100],
  [7, 10500, 10500, 10500, 10500, 100],
  [8, 10500, 10500, 10500, 10500, 100],
  [9, 11000, 11000, 11000, 11000, 100],
];

const perfectDownTrendChart = [
  [1, 11000, 11000, 11000, 11000, 100],
  [2, 10500, 10500, 10500, 10500, 100],
  [3, 10500, 10500, 10500, 10500, 100],
  [4, 10000, 10000, 10000, 10000, 100],
  [5, 10000, 10000, 10000, 10000, 100],
  [6, 9500, 9500, 9500, 9500, 100],
  [7, 9500, 9500, 9500, 9500, 100],
  [8, 9000, 9000, 9000, 9000, 100],
  [9, 9000, 9000, 9000, 9000, 100],
];

const perfectGridChart = [
  [1, 9000, 9000, 9000, 9000, 100],
  [2, 9000, 9000, 9000, 9000, 100],
  [3, 9500, 9500, 9500, 9500, 100],
  [4, 9500, 9500, 9500, 9500, 100],
  [5, 10000, 10000, 10000, 10000, 100],
  [6, 10000, 10000, 10000, 10000, 100],
  [7, 10500, 10500, 10500, 10500, 100],
  [8, 10500, 10500, 10500, 10500, 100],
  [9, 11000, 11000, 11000, 11000, 100],
  [10, 11000, 11000, 11000, 11000, 100],
  [11, 10500, 10500, 10500, 10500, 100],
  [12, 10500, 10500, 10500, 10500, 100],
  [13, 10000, 10000, 10000, 10000, 100],
  [14, 10000, 10000, 10000, 10000, 100],
  [15, 9500, 9500, 9500, 9500, 100],
  [16, 9500, 9500, 9500, 9500, 100],
  [17, 9000, 9000, 9000, 9000, 100],
  [18, 9000, 9000, 9000, 9000, 100],
  [19, 9000, 9000, 9000, 9000, 100],
  [20, 9000, 9000, 9000, 9000, 100],
  [21, 9500, 9500, 9500, 9500, 100],
  [22, 9500, 9500, 9500, 9500, 100],
  [23, 10000, 10000, 10000, 10000, 100],
  [24, 10000, 10000, 10000, 10000, 100],
  [25, 10500, 10500, 10500, 10500, 100],
  [26, 10500, 10500, 10500, 10500, 100],
  [27, 11000, 11000, 11000, 11000, 100],
];

describe('#Gridbot', () => {
  let gridBot: GridBot;

  beforeEach(() => {
    gridBot = new GridBot(gridBotConfig);
  });

  it('should Constructor set the properties', async () => {

    let sumGridQuote = 0;

    gridBot.grids.forEach(e => {
      sumGridQuote += e.maxQuantity * e.priceLow;
    });

    expect(sumGridQuote).toBeLessThanOrEqual(gridBotConfig.balanceQuote);
    expect(gridBot.grids).toHaveLength(gridBotConfig.gridQuantity);
  });

  it('should Update set initial orders', async () => {
    // Act
    gridBot.update(candleData[0] as OHLCV);

    // Assert
    const ExchangeOrders = gridBot.exchange.getOrders();

    expect(ExchangeOrders).toHaveLength(2);
    expect(gridBot.grids[0].maxQuantity).toBe(ExchangeOrders[0].origQty);
    expect(gridBot.grids[1].maxQuantity).toBe(ExchangeOrders[1].origQty);
  });
});

describe('#Perfect Gridbot', () => {
  let gridBot: GridBot;

  beforeEach(() => {
    gridBot = new GridBot(gridBotPerfect);
  });

  it('should increase Quote up-trend', async () => {
    // Arrange

    // Act
    for (let i = 0; i < perfectUpTrendChart.length; i++) {
      gridBot.update(perfectUpTrendChart[i] as OHLCV);
    }

    // Assert
    const ExchangeOrders = gridBot.exchange.getOrders();


    ExchangeOrders.forEach(order => {
      gridBot.exchange.cancelOrder(order.orderId);
    });



    const ExchangeBalance = gridBot.exchange.getBalance();


    gridBot.grids.forEach(grid => {
      expect(grid.ownedQuantity).toBe(0);
      expect(grid.activeOrderId).toBeGreaterThan(1);
    });

    expect(ExchangeBalance).toMatchObject({ balanceQuote: 1047.2807635000001 });
    expect(gridBot).toMatchObject({
      balanceAsset: 0,
      balanceQuote: 1047.2807428449998,
    });
  });

  it('should increase Asset down-trend', async () => {
    // Arrange

    // Act
    for (let i = 0; i < perfectDownTrendChart.length; i++) {
      gridBot.update(perfectDownTrendChart[i] as OHLCV);
    }

    // Assert
    const ExchangeOrders = gridBot.exchange.getOrders();

    ExchangeOrders.forEach(order => {
      gridBot.exchange.cancelOrder(order.orderId);
    });

    const ExchangeBalance = gridBot.exchange.getBalance();

    gridBot.grids.forEach(grid => {
      expect(grid.ownedQuantity).toBeGreaterThan(0);
      expect(grid.activeOrderId).toBeGreaterThan(1);
    });


    expect(ExchangeBalance).toMatchObject({ balanceAsset: 0.09748816000000002 });
    expect(gridBot).toMatchObject({
      balanceAsset: 0.09748776,
    });
  });

  it('should generate Profit perfectGridChart', async () => {
    // Arrange

    // Act
    for (let i = 0; i < perfectGridChart.length; i++) {
      gridBot.update(perfectGridChart[i] as OHLCV);
    }

    // Assert
    const ExchangeOrders = gridBot.exchange.getOrders();

    ExchangeOrders.forEach(order => {
      gridBot.exchange.cancelOrder(order.orderId);
    });

    const ExchangeBalance = gridBot.exchange.getBalance();

    gridBot.grids.forEach(grid => {
      expect(grid.ownedQuantity).toBe(0);
      expect(grid.activeOrderId).toBeGreaterThan(1);
    });


    expect(ExchangeBalance).toMatchObject({ balanceQuote: 1094.561527 });

  });



});
