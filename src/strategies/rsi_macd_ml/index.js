"use strict"

const logger = require("../../logger")
const Abstract_Strategy = require("../absctract_strategy")

class Strategy extends Abstract_Strategy {
  constructor(
    config = {
      rsi_buy: 35,
      rsi_sell: 65,
      stop_loss_limit: 0.95
    }
  ) {
    super()
    this.stop_loss_limit = config.stop_loss_limit
    this.rsi_buy = config.rsi_buy
    this.rsi_sell = config.rsi_sell

    // General Strategy config
    this.predict_on = 0
    this.learn = 1
    // General Strategy config

    // TA Indicators
    this.add_TA({ label: "RSI", update_interval: 60, ta_name: "RSI", params: 15, params2: "" })
    this.add_TA({ label: "MACD", update_interval: 60, ta_name: "MACD", params: { short: 12, long: 26, signal: 9 }, params2: "" })
    this.add_TA({ label: "CCI", update_interval: 60, ta_name: "CCI", params: { constant: 0.015, history: 14 }, params2: "" })
  }

  async update(candle) {
    try {
      // Update buffers and incidators
      this.update_TA(candle)
      this.update_STOPLOSS(candle.close)

      if (this.TAready()) {
        // Stop loss sell
        if (this.advice == "BUY" && this.STOP_LOSS == "stoploss") {
          this.SELL()
        }

        if (this.BUFFER.RSI[this.step] < this.rsi_buy) {
          this.BUY(candle.close)
        }

        // Sell
        if (this.BUFFER.RSI[this.step] > this.rsi_sell) {
          this.SELL(candle.close)
        }
      }
    } catch (e) {
      logger.error("BB Pure strategy error ", e)
    }
  }
}

module.exports = Strategy
