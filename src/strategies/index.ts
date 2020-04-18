// Store strategies name, description and config range!

export type StrategyInfo = {
  guid: number;
  name: string;
  desc: string;
  config: Record<string, any>;
};

export const STRATEGIES: StrategyInfo[] = [
  {
    guid: 1,
    name: 'bb_pure',
    desc: 'Bband strategy',
    config: {
      bb_period: [21, 21, 'int'],
      bb_up: [1.4, 2.2, 'float', 2],
      bb_down: [1.4, 2.2, 'float', 2],
    },
  },
  {
    guid: 2,
    name: 'rsi_macd',
    desc: 'RSI / MACD',
    config: {
      rsi_buy: [0, 100, 'float', 2],
      rsi_sell: [0, 100, 'float', 2],
    },
  },
];
