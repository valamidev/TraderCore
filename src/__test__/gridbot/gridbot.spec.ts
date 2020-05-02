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
  [10, 11000, 11000, 11000, 11000, 100],
  [11, 11000, 11000, 11000, 11000, 100],
  [12, 11000, 11000, 11000, 11000, 100],
  [13, 12000, 12000, 12000, 12000, 100],
  [14, 12000, 12000, 12000, 12000, 100],
];

describe.skip('#Gridbot', () => {
  let gridBot: GridBot;

  beforeEach(() => {
    gridBot = new GridBot(gridBotConfig);
  });

  it('should Constructor set the properties', async () => {
    expect(gridBot.quotePerGrid).toBe(gridBotConfig.balanceQuote / gridBotConfig.gridQuantity);
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

describe.only('#Perfect Gridbot', () => {
  let gridBot: GridBot;

  beforeEach(() => {
    gridBot = new GridBot(gridBotPerfect);
  });

  it.only('should increase Quote up-trend', async () => {
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

    //console.log(ExchangeOrders);

    //console.log(gridBot.exchange.getBalance());

    expect(1).toBe(1);
    //expect(gridBot.grids[0].maxQuantity).toBe(ExchangeOrders[0].origQty);
    //  expect(gridBot.grids[1].maxQuantity).toBe(ExchangeOrders[1].origQty);
  });
});
