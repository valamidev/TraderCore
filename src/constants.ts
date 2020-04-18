export const DEFAULT_BACKTEST_ARRAY_LIMIT = 30000000;

export const DEFAULT_STRATEGY_OPTIMIZER_INTERVALS = [
  60,
  120,
  180,
  300,
  600,
  900,
  1200,
  1800,
  3600,
  3600 * 3,
  3600 * 6,
  3600 * 12,
  3600 * 24,
  3600 * 48,
  3600 * 72,
  3600 * 24 * 7,
];

export const DEFAULT_LIVE_STRATEGY_HOT_START_CANDLE_SIZE = 3000;

export const DEFAULT_TRADERBOT_UPDATELOOP_TIMEOUT = 10 * 1000;

export const DEFAULT_TRADER_CONFIG = {
  stopLossLimit: 0.98,
  trailingLimit: 0.02,
  portionPct: 50,
  balanceAsset: 0,
  balanceQuote: 1000,
  fee: 0.002,
};

export enum EmulatorStates {
  LOADED = 'Loaded',
  READY = 'Ready',
}

export const EXCHANGE_BASE_INTERVAL_IN_SEC = 60;
