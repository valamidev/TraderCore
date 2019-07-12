"use strict";

// Store strategies name, description and config range!

const strategies = [
  {
    guid: 1,
    name: "cci_william",
    desc: "CCI +/- 100/200 oscillator (multiple) , Williams Alligator 13,8,5",
    config: {
      mul_cci_100: [0, 2, "float", 3],
      mul_cci_200: [0, 2, "float", 3],
      mul_cci_n100: [0, 2, "float", 3],
      mul_cci_n200: [0, 2, "float", 3],
      stop_loss_limit: [0.9, 0.95, "float", 3]
    }
  },

  {
    guid: 2,
    name: "macd_daddy",
    desc: "MACD 12,26,5 MACD supported by a RSI oscillator",
    config: {
      buy_signal_lenght: [6, 12, "int"],
      sell_signal_lenght: [6, 12, "int"],
      rsi_low: [0, 15, "int"],
      rsi_high: [85, 100, "int"],
      stop_loss_limit: [0.95, 0.97, "float", 3]
    }
  },

  {
    guid: 3,
    name: "sma_stoploss",
    desc: "Simple SMA(3-5) stoploss algo, good for swing trade",
    config: {
      sma_length: [3, 5, "int"],
      threshold_buy: [0.1, 1, "float", 3],
      threshold_sell: [-1, -0.1, "float", 3],
      stop_loss_limit: [0.9, 0.97, "float", 3]
    }
  },

  {
    guid: 4,
    name: "bb_pure",
    desc: "Bband period() with stoploss",
    config: {
      bb_period: [21, 21, "int"],
      bb_up: [1.4, 2.2, "float", 2],
      bb_down: [1.4, 2.2, "float", 2],
      stop_loss_limit: [0.95, 0.97, "float", 3]
    }
  },

  {
    guid: 5,
    name: "all_williams",
    desc: "Algo based on Williams indicator",
    config: {
      wf_period: [2, 4, "int"],
      massIndex_limit: [8, 11, "float", 2],
      stop_loss_limit: [0.9, 0.93, "float", 3]
    }
  },

  {
    guid: 6,
    name: "multi_trend_algo",
    desc: "Multi trend algo",
    config: {
      wf_period: [10, 30, "int"],
      massIndex_limit: [8, 11, "float", 2],
      stop_loss_limit: [0.9, 0.93, "float", 3]
    }
  },

  {
    guid: 7,
    name: "thurtle",
    desc: "Thurtle algorithm",
    config: {
      stop_loss_limit: [0.9, 0.93, "float", 3]
    }
  }
];

module.exports = strategies;
