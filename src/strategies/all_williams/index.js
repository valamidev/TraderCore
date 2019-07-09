"use strict";

const _ = require("lodash");
const logger = require("../../logger");

// Indicators
const RSI = require("../utils/indicators/RSI");
const OHCL4 = require("../utils/indicators/OHCL4");
const SMA = require("../utils/indicators/SMA");
const WF = require("../utils/indicators/WF");
const WA = require("../utils/indicators/WA");

const {
  Acceleration,
  AO,
  MassIndex,
  WR,
  StochRSI
} = require("bfx-hf-indicators"); //Absolute True Range

// Stoploss
const STOPLOSS = require("../utils/indicators/STOPLOSS");

class Strategy {
  constructor(
    config = {
      wf_period: 3,
      massIndex_limit: 9.5,
      stop_loss_limit: 0.92
    }
  ) {
    // General Strategy config
    this.advice;
    this.step = 0;
    this.minimum_history = 100;
    // General Strategy config

    // Strategy config

    this.stop_loss_limit = config.stop_loss_limit;
    this.massIndex_limit = config.massIndex_limit;
    // Strategy config

    // Indicators
    this.rsi = new RSI(14);
    this.ohcl4 = new OHCL4();
    this.sma = new SMA(5);
    this.wf = new WF(config.wf_period);
    this.wa = new WA({
      jawLength: 21,
      teethLength: 13,
      lipsLength: 8,
      jawOffset: 13,
      teethOffset: 8,
      lipsOffset: 5
    });

    this.acceleration = new Acceleration([34]); //Acceleration							candle.close		Period
    this.ao = new AO([10]); //Awesome Oscillator					candle OHLC			NO ARGS, LABEL PERIOD ?  !!!!!!!!!!!!!!!!!
    this.massIndex = new MassIndex([10]); //Mass Index							candle OHLC			Period
    this.wr = new WR([14]); //Williams %R							candle OHLC			Period
    this.stochRsi = new StochRSI([14, 14, 3, 3]); //Stochastic RSI						candle.close		'Length RSI', 'Length Stochastic', 'Stoch Smoothing', 'Signal Smoothing'

    //Stoploss
    this.stop_loss = new STOPLOSS(this.stop_loss_limit);
    // Indicators

    // Buffer
    this.BUF = {
      candle: [],
      ohcl4: [],
      rsi: [],
      sma: [],
      wf: [],
      acceleration: [],
      ao: [],
      massIndex: [],
      wr: [],
      wa: [],
      stochRsi: []
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
    // BFXR extension for candle
    candle.vol = candle.volume;

    this.BUF.candle.push(candle);

    // Middle price ( open + high + close + low / 4)
    this.ohcl4.update(candle);
    this.BUF.ohcl4.push(this.ohcl4.result);

    // RSI
    this.rsi.update(candle);
    this.BUF.rsi.push(this.rsi.result);
    // SMA
    this.sma.update(this.ohcl4.result);
    this.BUF.sma.push(this.sma.result);
    // Williams Fractal
    this.wf.update(candle);
    this.BUF.wf.push(this.wf.result);
    // Williams Alligator
    this.wa.update(candle);
    this.BUF.wa.push(this.wa.result);

    // BRFX indicators

    this.stochRsi.add(candle.close);
    this.BUF.stochRsi.push(this.stochRsi.v());

    this.massIndex.add(candle);
    this.BUF.massIndex.push(this.massIndex.v());

    /* this.acceleration.add(candle.close);*/

    // Stop loss
    this.stop_loss.update(this.BUF.candle[this.step]);
  }

  async BUY() {
    if (this.advice == "BUY") {
      return;
    }

    this.advice = "BUY";
    this.stop_loss.updatePrice(this.BUF.candle[this.step]);
  }

  async SELL() {
    if (this.advice == "SELL") {
      return;
    }

    this.advice = "SELL";
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

        if (this.BUF.wf[this.step] != "none") {
          // Set Williams fractal about last direction change
          /*  console.log(
            "Direction: ",
            this.BUF.wf[this.step],
            "Alligator level: ",
            this.BUF.wa[this.step]
          );*/
        }

        if (typeof this.BUF.stochRsi[this.step] == "undefined") {
          this.BUF.stochRsi[this.step] = { v: 50, signal: 50 };
        }

        if (
          this.BUF.wf[this.step] == "down" &&
          this.BUF.wa[this.step].lips > this.BUF.wa[this.step].jaw &&
          this.BUF.wa[this.step].lips > this.BUF.wa[this.step].teeth &&
          this.BUF.wa[this.step].teeth > this.BUF.wa[this.step].jaw &&
          this.BUF.stochRsi[this.step].v < 20 &&
          this.BUF.massIndex[this.step] > this.massIndex_limit
        ) {
          /* console.log(
            "Buy rsi: ",
            this.BUF.massIndex[this.step],
            this.BUF.stochRsi[this.step]
          );*/

          await this.BUY();
        }

        if (
          this.BUF.wf[this.step] == "up" &&
          this.BUF.wa[this.step].jaw > this.BUF.wa[this.step].lips &&
          this.BUF.wa[this.step].jaw > this.BUF.wa[this.step].teeth &&
          this.BUF.wa[this.step].teeth > this.BUF.wa[this.step].lips &&
          this.BUF.stochRsi[this.step].v > 80 &&
          this.BUF.massIndex[this.step] > this.massIndex_limit
        ) {
          /*   console.log(
            "Sell rsi: ",
            this.BUF.massIndex[this.step],
            this.BUF.stochRsi[this.step]
          );*/
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
