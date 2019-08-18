"use strict"

const logger = require("../../logger")
const Abstract_Strategy = require("../absctract_strategy")

class Strategy extends Abstract_Strategy {
  constructor(config = {}) {
    super()

    this.rsi_buy = config.rsi_buy || 30
    this.rsi_sell = config.rsi_sell || 70

    // General Strategy config
    this.predict_on = 0
    this.learn = 1
    // General Strategy config

    // TA Indicators
    this.add_TA({ label: "SMA_5_5min", update_interval: 300, ta_name: "SMA", params: 5, params2: "ohlc/4" })
    this.add_TA({ label: "RSI_5", update_interval: 900, ta_name: "RSI", params: 15, params2: "" })
    this.add_TA({ label: "RSI_60", update_interval: 3600, ta_name: "RSI", params: 15, params2: "" })
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.update_candle(candledata)

      if (this.TAready()) {
        let candle = candledata[60]

        if (
          this.BUFFER.RSI_5[this.step] < this.rsi_buy &&
          this.BUFFER.RSI_60[this.step] < this.rsi_buy &&
        ) {
          this.BUY(candle.close)
        }

        if (this.BUFFER.RSI_5[this.step] > this.rsi_sell && this.BUFFER.RSI_60[this.step] > this.rsi_sell) {
          this.SELL(candle.close)
        }
      }
    } catch (e) {
      logger.error("Strategy error ", e)
    }
  }
}

module.exports = Strategy
