import { OHLCV } from 'candlestick-convert';
import { Emulator } from './emulator/emulator';

export type batchedOHLCV = Map<string, OHLCVMapFlat>;

export type OHLCVMapFlat = Map<string, OHLCV>;

export type OHLCVMap = Map<string, OHLCV[]>;

export type AdviceSchema = {
  action: string;
  price: number;
  time: number;
  quantity?: number;
  close?: number;
};

export type OrderSchema = {
  closed: number;
  sold: number;
  closeType: string;
  balance: number;
};

export type ExchangeOrderInfoSchema = {
  id: string;
  side: string;
  remaining: number;
  amount: number;
  price: number;
  filled: number;
  cost: number;
};

export type createOrderSchema = {
  size: number;
  type: string;
  price: number;
  time: number;
  stopLossLimit: number;
  trailingLimit: number;
};

export interface BacktestEmulatorInit {
  symbol: string;
  exchange: string;
  strategy: string;
  strategyConfig: StrategyConfig;
  traderConfig: TradeEmulatorConfig;
  intervals: number[];
  candledata: batchedOHLCV;
}

export interface Simulation {
  exchange: string;
  symbol: string;
  emulator: Emulator;
  [key: string]: unknown;
}

export interface EmulatorConfig {
  exchange: string;
  symbol: string;
  strategy: string;
  strategyConfig: StrategyConfig;
  intervals: number[];
  traderConfig?: TradeEmulatorConfig;
}

export interface LiveSimulation {
  exchange: string;
  symbol: string;
  strategy: string;
  strategyConfig: StrategyConfig;
  intervals: number[];
  emulator: Emulator;
  [key: string]: unknown;
}

export interface StrategyOptimizerConfig {
  exchange: string;
  symbol: string;
  numberOfExecution: number;
  strategy: string;
  traderConfig: TradeEmulatorConfig;
  candledata: batchedOHLCV;
}

export interface TradeEmulatorConfig {
  balanceAsset: number;
  balanceQuote: number;
  fee: number;
  stopLossLimit: number;
  trailingLimit: number;
  portionPct: number;
}

export interface TradeInstanceConfig {
  instanceID: number;
  symbol: string;
  asset: string;
  quote: string;
  balanceAsset: number;
  balanceQuote: number;
  orderBalanceAsset: number;
  orderBalanceQuote: number;
  strategyGuid: number;
  orderLimit: number;
  exchange: string;
}

export interface StrategyConfig {
  readonly [key: string]: unknown;
}

export interface TraderConfig {
  readonly [key: string]: unknown;
}

export type configTA = {
  label: string;
  updateInterval: number;
  nameTA: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
  params2: string;
};
