import { batchedOHLCV } from '../../types';
import { Emulator } from '../../emulator/emulator';
import { EmulatorStates, DEFAULT_TRADER_CONFIG } from '../../constants';

import candleData from '../fixtures/candleData';

describe('Emulator', () => {
  let emulator: Emulator;

  it('should after Start update the properties ', async () => {
    // Arrange
    const lastCandleTick = candleData[Object.keys(candleData)[Object.keys(candleData).length - 1]];

    emulator = new Emulator({
      exchange: 'binance',
      symbol: 'BTC/USDT',
      strategy: 'bb_pure',
      strategyConfig: { intervals: [60, 300] },
      intervals: [60, 300],
      traderConfig: DEFAULT_TRADER_CONFIG,
    });

    // Act
    await emulator.start((candleData as any) as batchedOHLCV);

    // Assert
    expect(emulator).toHaveProperty('lastUpdateTime', lastCandleTick['60'].time);
    expect(emulator).toHaveProperty('lastUpdate', lastCandleTick);
    expect(emulator.state).toBe(EmulatorStates.READY);
  });
});
