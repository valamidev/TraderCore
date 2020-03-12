import { StrategyOptimizer } from '../../emulator/strategy_optimizer';
import { fakeBatchedCandlestickMap } from '../utils/candlestick_generator';
import { DEFAULT_TRADER_CONFIG } from '../../constants';
// const baseIntervals = [60];

describe.only('Strategy Optimizer', () => {
  let optimizer: StrategyOptimizer;

  it.only('should create StrategyOptimizer object ', async () => {
    // Arrange
    const candledata = fakeBatchedCandlestickMap([60, 300, 1200], 10);

    optimizer = new StrategyOptimizer({
      exchange: 'Test',
      symbol: 'BTC/USDT',
      numberOfExecution: 10,
      strategy: 'bb_pure',
      traderConfig: DEFAULT_TRADER_CONFIG,
      candledata,
    });

    expect(optimizer).toStrictEqual(expect.any(Object));
  });
});
