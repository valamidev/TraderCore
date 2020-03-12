import { StrategyOptimizer } from '../../emulator/strategy_optimizer';
import { fakeBatchedCandlestickMap } from '../utils/candlestick_generator';
import { DEFAULT_TRADER_CONFIG } from '../../constants';
// const baseIntervals = [60];

describe('Strategy Optimizer', () => {
  const candledata = fakeBatchedCandlestickMap([60, 300, 1200], 1000);
  const optimizer = new StrategyOptimizer({
    exchange: 'Test',
    symbol: 'BTC/USDT',
    numberOfExecution: 10,
    strategy: 'bb_pure',
    traderConfig: DEFAULT_TRADER_CONFIG,
    candledata,
  });

  it('should create StrategyOptimizer object ', async () => {
    // Assert
    expect(optimizer).toStrictEqual(expect.any(Object));
  });

  it('should execute and return results', async () => {
    // Act

    const result = await optimizer.execute();

    // Assert
    expect(result).toHaveLength(10);
    expect(result[0]).toMatchObject({
      strategy: 'bb_pure',
      config: expect.any(Object),
      historyOrders: expect.any(Array),
      performance: expect.any(Number),
      numOfOrders: expect.any(Number),
    });
  });
});
