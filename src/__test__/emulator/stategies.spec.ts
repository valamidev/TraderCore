import { AbstractStrategy } from '../../strategies/abstract_strategy';
import { getBatchedCandlestickMap } from '../utils/candlestick_generator';
// const baseIntervals = [60];

describe.only('Strategy', () => {
  let strategy: AbstractStrategy;

  it.only('should after Start update the properties ', async () => {
    // Arrange
    const candleData = getBatchedCandlestickMap([60, 300], 1000);
    const updateTimeStamps = Object.keys(candleData);

    strategy = new AbstractStrategy();
    strategy.addNeWTA({ label: 'SMA_5_5min', updateInterval: 300, nameTA: 'SMA', params: 5, params2: 'ohlc/4' });
    strategy.addNeWTA({ label: 'SMA_5_2min', updateInterval: 120, nameTA: 'SMA', params: 5, params2: 'ohlc/4' });
    strategy.addNeWTA({ label: 'SMA_5_1min', updateInterval: 60, nameTA: 'SMA', params: 5, params2: 'ohlc/4' });

    // Act
    for (const timeStamp of updateTimeStamps) {
      await strategy.update(candleData[timeStamp]);
    }

    // Assert
    const updateSteps = strategy.step;
    const SMA5min = (strategy.TA_BUFFER as any).SMA_5_5min;
    const SMA1min = (strategy.TA_BUFFER as any).SMA_5_1min;

    const SMA2min = (strategy.TA_BUFFER as any).SMA_5_2min;

    expect(updateSteps).toBe(1006);
    expect(strategy.isStrategyReady()).toBe(true);
    expect(SMA5min[updateSteps]).toBeDefined;
    expect(SMA1min[updateSteps]).toBeDefined;
    expect(SMA2min[updateSteps]).toBe(-1);
  });
});
