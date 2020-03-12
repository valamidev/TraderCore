import { BacktestEmulator } from '../../emulator/backtest_emulator';
import { batchedOHLCV } from '../../types';

import candleData from '../fixtures/candleData';
import { DEFAULT_TRADER_CONFIG } from '../../constants';

const Backtest = new BacktestEmulator();

describe('BackTest Emulator', () => {
  it('should give back Actions and Performance', async () => {
    // Act
    await Backtest.start({
      exchange: 'binance',
      symbol: 'BTC/USDT',
      strategy: 'bb_pure',
      strategyConfig: { intervals: [60, 300] },
      intervals: [60, 300],
      traderConfig: DEFAULT_TRADER_CONFIG,
      candledata: (candleData as any) as batchedOHLCV,
    });

    // Assert
    expect(Backtest.actions).toHaveLength(0);
    expect(Backtest).toHaveProperty('performance', 1000);
  });
});
