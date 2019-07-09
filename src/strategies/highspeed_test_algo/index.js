"use strict";

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
const STOPLOSS = require("../utils/indicators/STOPLOSS");

// ML API
const ml_api = require("../utils/ml_api");

class Strategy {
  constructor(
    config = { threshold_buy: 1, threshold_sell: -1, stop_loss_limit: 0.85 }
  ) {
    // General Strategy config
    this.advice;
    this.step = 0;
    this.minimum_history = 100;

    this.predict_on = 0;
    this.learn = 1;
    // General Strategy config

    // Strategy config
    this.threshold_buy = config.threshold_buy;
    this.threshold_sell = config.threshold_sell;
    this.stop_loss_limit = config.stop_loss_limit;

    this.stop_loss = new STOPLOSS(this.stop_loss_limit);
    // Strategy config

    // Indicators
    this.bb = new BB({ TimePeriod: 21, NbDevUp: 1.7, NbDevDn: 1.7 });
    this.rsi = new RSI(21);
    this.obi = new OBI(15);
    this.x_smma = new X_SMMA(10, 20);
    this.trix = new TRIX(18);
    this.ohcl4 = new OHCL4();
    this.sma = new SMA(5);

    // Indicators

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
      sma: []
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

    // Stop loss
    this.stop_loss.update(this.BUF.candle[this.step]);
  }

  async BUY() {
    this.current_trade.buy_price = this.BUF.candle[this.step].close;

    this.current_trade.buy_in = [];

    // Machine learning datas
    for (let k = 5; k >= 0; k--) {
      this.current_trade.buy_in.push(this.BUF.obi[this.step - k]);
      this.current_trade.buy_in.push(this.BUF.x_smma[this.step - k]);
      this.current_trade.buy_in.push(this.BUF.trix[this.step - k]);
      this.current_trade.buy_in.push(this.BUF.rsi[this.step - k]);
    }

    if (this.predict_on == 1) {
      let predict = await ml_api.predict(this.current_trade.buy_in, "lstm");

      console.log(predict);

      if (predict["0"] > 0.5) {
        // Machine learning
        this.advice = "BUY";
        this.stop_loss.update(this.BUF.candle[this.step]);
      }
    } else {
      // No Machine learning
      this.advice = "BUY";
      this.stop_loss.update(this.BUF.candle[this.step]);
    }
  }

  async SELL() {
    if (this.current_trade.buy_in.length > 0) {
      this.advice = "SELL";

      if (this.learn == 1) {
        this.current_trade.sell_price = this.BUF.candle[this.step].close;
        this.trade_history.push(this.current_trade);
        this.reset_current_trade();
      }
    }
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.update_buffer(candledata);

      if (this.step > this.minimum_history) {
        let signal = Math.random();

        console.log("SIGNAL: ", signal);

        // Buy
        if (signal > 0.5 && this.advice != "BUY") {
          await this.BUY();
        }

        // Sell
        if (signal < 0.5 && this.advice != "SELL") {
          await this.SELL();
        }
      }

      // Successful update increase step
      this.step++;
    } catch (e) {
      logger.error("Emulator error ", e);
    }
  }
}

module.exports = Strategy;
