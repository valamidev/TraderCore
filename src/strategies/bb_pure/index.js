"use strict"

const logger = require("../../logger")
const Abstract_Strategy = require("../absctract_strategy")

class Strategy extends Abstract_Strategy {
  constructor(
    config = {
      bb_period: 21,
      bb_up: 1.7,
      bb_down: 1.7,
      stop_loss_limit: 0.85
    }
  ) {
    super()
    // General Strategy config
    this.predict_on = 0
    this.learn = 1
    // General Strategy config

    // TA Indicators
    this.add_TA({
      label: "BB",
      update_interval: 60,
      ta_name: "BB",
      params: {
        TimePeriod: config.bb_period,
        NbDevUp: config.bb_up,
        NbDevDn: config.bb_down
      },
      params2: "ohlcv/4"
    })

    this.add_TA({ label: "RSI", update_interval: 60, ta_name: "RSI", params: 21 })
    this.add_TA({ label: "OBI", update_interval: 60, ta_name: "OBI", params: 15 })
    this.add_TA({ label: "SMA_5", update_interval: 60, ta_name: "SMA", params: 5, params2: "ohlcv/4" })
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

        if (candle.low < this.BUFFER.BB[this.step].lower) {
          this.BUY()
        }

        // Sell
        if (candle.high > this.BUFFER.BB[this.step].upper) {
          this.SELL()
        }
      }
    } catch (e) {
      logger.error("BB Pure strategy error ", e)
    }
  }
}

module.exports = Strategy
