"use strict";

const _ = require("lodash");
const logger = require("../../logger");

// Indicators

const TA_buffer = require("../utils/ta_buffer");

//
const STOPLOSS = require("../utils/indicators/STOPLOSS");

class Strategy {
  constructor(
    config = {
      buy_cond: 9,
      sell_cond: 9,
      stop_loss_limit: 0.9
    }
  ) {
    // General Strategy config
    this.advice;
    this.step = 0;
    this.minimum_history = 100;
    this.predict_on = 0;
    this.learn = 0;
    // General Strategy config

    // Strategy config
    this.buy_cond = config.buy_cond;
    this.sell_cond = config.sell_cond;
    this.stop_loss_limit = config.stop_loss_limit;
    this.stop_loss = new STOPLOSS(this.stop_loss_limit);

    // Buffer
    this.ta_buff = new TA_buffer();
    this.candle = []; // Candle buffer TODO remove

    // Machine learning buffer!
    this.trade_history = [];

    this.current_trade = {
      buy_price: 0,
      sell_price: 0,
      buy_in: [],
      time_history: []
    };
  }

  update_buffer(candle) {
    // Candle Buffer
    this.candle.push(candle);
    this.ta_buff.update(candle);

    // Stop loss
    this.stop_loss.update(candle);
  }

  BUY() {
    this.advice = "BUY";
    this.stop_loss.updatePrice(this.candle[this.step]);
  }

  SELL() {
    this.advice = "SELL";
  }

  async update(candle) {
    try {
      // Update buffers and incidators
      this.update_buffer(candle);

      if (this.step > this.minimum_history) {
        // Stop loss sell
        if (this.advice == "BUY" && this.stop_loss.action == "stoploss") {
          await this.SELL();
        }

        let conditions_buy = [];
        let conditions_sell = [];

        let price_05pct = candle.close * 0.005;

        //RSI
        conditions_buy.push(this.condition_higher(this.ta_buff.rsi, 15));
        conditions_sell.push(this.condition_lower(this.ta_buff.rsi, 85));

        // ATR
        conditions_buy.push(
          this.condition_lower(this.ta_buff.atr, price_05pct)
        );
        conditions_sell.push(
          this.condition_higher(this.ta_buff.atr, price_05pct)
        );

        // ALMA - Arnaud Legoux Moving Averages
        conditions_buy.push(
          this.condition_higher(this.ta_buff.alma, candle.close)
        );
        conditions_sell.push(
          this.condition_lower(this.ta_buff.alma, candle.close)
        );

        // Aroon UP/ DOWN 0-100
        conditions_buy.push(this.condition_higher(this.ta_buff.aroon.down, 95));
        conditions_sell.push(this.condition_lower(this.ta_buff.aroon.up, 5));

        // ADX
        conditions_buy.push(this.condition_higher(this.ta_buff.adx, 40));
        conditions_sell.push(this.condition_higher(this.ta_buff.adx, 20));

        // Awesome oscillator
        conditions_buy.push(
          this.condition_lower(this.ta_buff.ao, -price_05pct)
        );
        conditions_sell.push(
          this.condition_higher(this.ta_buff.ao, price_05pct)
        );

        // Balance of power
        conditions_buy.push(this.condition_higher(this.ta_buff.bop, 0.2));
        conditions_sell.push(this.condition_lower(this.ta_buff.bop, -0.2));

        // BB bands
        conditions_buy.push(
          this.condition_higher(this.ta_buff.bBands.bottom, candle.close)
        );
        conditions_sell.push(
          this.condition_lower(this.ta_buff.bBands.top, candle.close)
        );

        // CMF
        conditions_buy.push(this.condition_higher(this.ta_buff.cmf, 0));
        conditions_sell.push(this.condition_lower(this.ta_buff.cmf, 0));

        // Chaiking oscillator
        conditions_buy.push(this.condition_higher(this.ta_buff.chaikinOsc, 0));
        conditions_sell.push(this.condition_lower(this.ta_buff.chaikinOsc, 0));

        // SMA
        conditions_buy.push(
          this.condition_higher(this.ta_buff.sma, candle.close)
        );
        conditions_sell.push(
          this.condition_lower(this.ta_buff.sma, candle.close)
        );

        // Chandemo
        conditions_buy.push(this.condition_lower(this.ta_buff.chandeMO, -40));
        conditions_sell.push(this.condition_higher(this.ta_buff.chandeMO, 40));

        // StochRSI
        conditions_buy.push(
          this.condition_lower(
            this.ta_buff.stochRsi.v,
            this.ta_buff.stochRsi.signal
          )
        );
        conditions_sell.push(
          this.condition_higher(
            this.ta_buff.stochRsi.v,
            this.ta_buff.stochRsi.signal
          )
        );

        // Volume Osc
        conditions_buy.push(this.condition_lower(this.ta_buff.vo, -15));
        conditions_sell.push(this.condition_higher(this.ta_buff.vo, 15));

        // Mass index (10), decision at 9.5
        conditions_buy.push(this.condition_lower(this.ta_buff.massIndex, 9.8));
        conditions_sell.push(this.condition_lower(this.ta_buff.massIndex, 9.8));

        // Decision make!
        if (_.sum(conditions_buy) > this.buy_cond && this.advice != "BUY") {
          // Buy
          this.BUY();
        }

        // Sell
        if (_.sum(conditions_sell) > this.sell_cond && this.advice != "SELL") {
          this.SELL();
        }
      }

      // Successful update increase step
      this.step++;
    } catch (e) {
      logger.error("Emulator error ", e);
    }
  }

  condition_higher(condition, value) {
    if (condition > value) {
      return 1;
    }

    return 0;
  }

  condition_lower(condition, value) {
    if (condition < value) {
      return 1;
    }

    return 0;
  }
}

module.exports = Strategy;
