import { BacktestEmulator } from '../../emulator/backtest_emulator';
import { batchedOHLCV } from '../../types';

import candleData from '../fixtures/candleData';

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
      traderConfig: { stopLossLimit: 0.98, trailingLimit: 0.02, portionPct: 30, balanceAsset: 0, balanceQuote: 1000, fee: 0.002 },
      candledata: (candleData as any) as batchedOHLCV,
    });

    // Assert
    expect(Backtest.actions).toHaveLength(0);
    expect(Backtest).toHaveProperty('performance', 1000);
  });
});
