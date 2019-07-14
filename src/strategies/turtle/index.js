"use strict";

/*
https://pipbear.com/price-action-pattern/turtle-strategy/

*/

const _ = require("lodash");
const logger = require("../../logger");

// Indicators
const RSI = require("../utils/indicators/RSI");
const BB = require("../utils/indicators/BB");
const OBI = require("../utils/indicators/OBI");
const X_SMMA = require("../utils/indicators/CROSS_SMMA");
const TRIX = require("../utils/indicators/TRIX");
const OHCL4 = require("../utils/indicators/OHCL4");
const SMA = require("../utils/indicators/SMA");
const MACD = require("../utils/indicators/MACD");

const DONC = require("../utils/indicators/DONCHIAN");
const ATR = require("../utils/indicators/ATR");

const STOPLOSS = require("../utils/indicators/STOPLOSS");

// ML API
const ml_api = require("../utils/ml_api");

class Strategy {
  constructor(
    config = {
      donc_short: 10,
      donc_mid: 20,
      donc_long: 55,
      atr: 20,
      stop_loss_limit: 0.9
    }
  ) {
    // General Strategy config
    this.advice;
    this.step = 0;
    this.minimum_history = 100;

    this.predict_on = 0;
    this.learn = 1;
    // General Strategy config

    // Indicators
    this.bb = new BB({ TimePeriod: 21, NbDevUp: 1.7, NbDevDn: 1.7 });
    this.rsi = new RSI(21);
    this.obi = new OBI(15);
    this.x_smma = new X_SMMA(10, 20);
    this.trix = new TRIX(18);
    this.ohcl4 = new OHCL4();
    this.sma = new SMA(5);
    this.macd = new MACD({ short: 12, long: 26, signal: 5 });

    this.donc_short = new DONC(config.donc_short);
    this.donc_mid = new DONC(config.donc_mid);
    this.donc_long = new DONC(config.donc_long);

    this.atr = new ATR(config.atr);

    this.stop_loss = new STOPLOSS(config.stop_loss_limit);
    // Indicators

    // Thurtle variables
    // Needed for Entry rules
    this.last_entry_type = "none";
    this.last_trade_profit = 0;
    this.buy_price = 0;
    this.sell_price = 0;

    // Buffer
    this.BUF = {
      candle: [],
      candle_mid: [],
      bb_upper: [],
      bb_lower: [],
      bb_middle: [],
      rsi: [],
      obi: [],
      x_smma: [],
      trix: [],
      sma: [],
      macd_result: [],
      macd_signal: [],
      donc_short: [],
      donc_mid: [],
      donc_long: [],
      atr: []
    };
    // Buffer

    // Machine learning buffer!
    this.trade_history = [];

    this.current_trade = {
      buy_price: 0,
      sell_price: 0,
      buy_in: [],
      time_history: []
    };
  }

  reset_current_trade() {
    this.current_trade = {
      buy_in: [],
      time_history: [],
      buy_price: 0,
      sell_price: 0
    };
  }

  update_buffer(candle) {
    // Candle Buffer
    this.BUF.candle.push(candle);

    // Middle price ( open + high + close + low / 4)
    this.ohcl4.update(candle);
    this.BUF.candle_mid.push(this.ohcl4.result);

    // BB
    this.bb.update(this.ohcl4.result);
    this.BUF.bb_upper.push(this.bb.upper);
    this.BUF.bb_lower.push(this.bb.lower);
    this.BUF.bb_middle.push(this.bb.middle);
    // Cross SMMA
    this.x_smma.update(this.ohcl4.result);
    this.BUF.x_smma.push(this.x_smma.result);
    // TRIX
    this.trix.update(this.ohcl4.result);
    this.BUF.trix.push(this.trix.result);
    // RSI
    this.rsi.update(candle);
    this.BUF.rsi.push(this.rsi.result);
    // OBI
    this.obi.update(candle);
    this.BUF.obi.push(this.obi.result);
    // SMA
    this.sma.update(this.ohcl4.result);
    this.BUF.sma.push(this.sma.result);
    // MACD
    this.macd.update(this.ohcl4.result);
    this.BUF.macd_result.push(this.macd.result);
    this.BUF.macd_signal.push(this.macd.signal.result);

    // Donchain
    this.donc_short.update(candle);
    this.BUF.donc_short.push(this.donc_short.result);

    this.donc_mid.update(candle);
    this.BUF.donc_mid.push(this.donc_mid.result);

    this.donc_long.update(candle);
    this.BUF.donc_long.push(this.donc_long.result);

    // Avarage True Range
    this.atr.update(candle);
    this.BUF.atr.push(this.atr.result);

    // Stop loss
    this.stop_loss.update(this.BUF.candle[this.step]);
  }

  async BUY(entry_type) {
    if (this.advice == "BUY") {
      return;
    }

    this.advice = "BUY";
    this.stop_loss.updatePrice(this.BUF.candle[this.step]);
    this.buy_price = this.BUF.candle[this.step].close;
    this.last_entry_type = entry_type;
  }

  async SELL() {
    if (this.advice == "SELL") {
      return;
    }

    this.advice = "SELL";
    this.sell_price = this.BUF.candle[this.step].close;
    this.trade_profit();
    this.last_entry_type = "none";
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.update_buffer(candledata);

      if (this.step > this.minimum_history) {
        // Strategy loaded

        // Stop loss sell
        if (this.stop_loss.action == "stoploss") {
          await this.SELL();
        }

        // Entry - The price breaks out of a 20-day + The previous trade was a losing one
        if (
          this.BUF.candle[this.step].high >= this.BUF.donc_mid[this.step].max &&
          this.last_trade_profit < 0
        ) {
          await this.BUY("20day");
        }

        // Entry -  The price breaks out of a 55-day Donchian channel.
        if (
          this.BUF.candle[this.step].high >= this.BUF.donc_long[this.step].max
        ) {
          await this.BUY("55day");
        }

        // 20-day channel, you need to exit at the breakout of the opposite 10-day channel.
        if (
          this.BUF.candle[this.step].low <=
            this.BUF.donc_short[this.step].min &&
          this.last_entry_type == "20day"
        ) {
          await this.SELL();
        }

        // 55-day,  you need to exit at the breakout of the opposite 20-day channel.
        if (
          this.BUF.candle[this.step].low <= this.BUF.donc_mid[this.step].min &&
          this.last_entry_type == "55day"
        ) {
          await this.SELL();
        }
      }
    } catch (e) {
      logger.error("Emulator error ", e);
    } finally {
      // Successful update increase step
      this.step++;
    }
  }

  trade_profit() {
    this.last_trade_profit = this.sell_price - this.buy_price;
  }
}

module.exports = Strategy;
