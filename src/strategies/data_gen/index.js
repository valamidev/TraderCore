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

// ML API
const ml_api = require("../utils/ml_api");

class Strategy {
  constructor(config = {}) {
    // General Strategy config//
    this.advice;
    this.step = 0;
    this.minimum_history = 100;

    this.predict_on = 0;
    this.learn = 0;
    // General Strategy config//

    // Strategy config
    this.persistence = 7;
    this.low = 35;
    this.high = 45;
    this.low_mod = 3;
    this.high_mod = 3;

    this.trend = {
      zone: "", // none, top, high, low, bottom
      duration: 0,
      persisted: false
    };
    // Strategy config

    // Indicators
    this.bb = new BB({ TimePeriod: 21, NbDevUp: 1.7, NbDevDn: 1.7 });
    this.rsi = new RSI(21);
    this.obi = new OBI(15);
    this.x_smma = new X_SMMA(10, 20);
    this.trix = new TRIX(18);
    this.ohcl4 = new OHCL4();
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
      trix: []
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

    // Middle price
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
  }

  async BUY() {
    this.current_trade.buy_price = this.BUF.candle[this.step].close;

    this.current_trade.buy_in = [];

    // Machine learning datas
    for (let k = 10; k >= 0; k--) {
      this.current_trade.buy_in.push(this.BUF.obi[this.step - k]);
      this.current_trade.buy_in.push(this.BUF.x_smma[this.step - k]);
      this.current_trade.buy_in.push(this.BUF.trix[this.step - k]);
      this.current_trade.buy_in.push(this.BUF.rsi[this.step - k]);
    }

    if (this.predict_on == 1) {
      let predict = await ml_api.predict(this.current_trade.buy_in, "lstm");

      console.log(predict);

      if (predict["0"] > 0.5) {
        this.advice = "BUY";
      }
    } else {
      this.advice = "BUY";
    }
  }

  async SELL() {
    if (this.current_trade.buy_in.length > 0) {
      this.advice = "SELL";
      this.current_trade.sell_price = this.BUF.candle[this.step].close;
      this.trade_history.push(this.current_trade);
      this.reset_current_trade();
    }
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.update_buffer(candledata);

      if (this.step > this.minimum_history) {
        let zone = "none";

        let price_close = candledata.close;

        // Set current zone
        if (price_close >= this.BUF.bb_upper[this.step]) zone = "top";
        if (
          price_close < this.BUF.bb_upper[this.step] &&
          price_close >= this.BUF.bb_middle[this.step]
        )
          zone = "high";
        if (
          price_close > this.BUF.bb_lower[this.step] &&
          price_close < this.BUF.bb_middle[this.step]
        )
          zone = "low";
        if (price_close <= this.BUF.bb_lower[this.step]) zone = "bottom";

        // In Zone
        if (this.trend.zone == zone) {
          this.trend = {
            zone: zone, // none, top, high, low, bottom
            duration: this.trend.duration + 1,
            persisted: true
          };
        } else {
          this.trend = {
            zone: zone, // none, top, high, low, bottom
            duration: 0,
            persisted: false
          };
        }

        let risk = this.risk();

        // Buy
        if (
          price_close <= this.BUF.bb_lower[this.step] &&
          this.BUF.rsi[this.step] <= 32 &&
          this.trend.duration >= risk.persistence &&
          this.advice != "BUY"
        ) {
          await this.BUY();
        }

        // Sell
        if (
          price_close >= this.BUF.bb_middle[this.step] &&
          this.BUF.rsi[this.step] >= 42 &&
          this.advice != "SELL"
        ) {
          await this.SELL();
        }
      }

      this.step++;
    } catch (e) {
      logger.error("Emulator error ", e);
    }
  }

  risk() {
    // BB middle - BB low / Midprice

    let percent_of_price =
      (this.BUF.bb_middle[this.step] - this.BUF.bb_lower[this.step]) /
      this.BUF.candle_mid[this.step];

    let lowModifier = percent_of_price * this.low_mod;
    let highModifier = percent_of_price * this.high_mod;

    let rsiLowThresh = this.low - this.low * lowModifier;

    let rsiHighThresh = this.high - this.high * highModifier;

    let scaledPercent = percent_of_price * 1000;

    let persistence = this.persistence;

    if (scaledPercent > 4 && scaledPercent < 10) {
      persistence -= 1;
    }

    if (scaledPercent >= 10 && scaledPercent < 20) {
      persistence -= 2;
    }

    if (scaledPercent >= 20) {
      persistence -= 3;
    }

    return { rsiLowThresh, rsiHighThresh, persistence };
  }
}

module.exports = Strategy;
