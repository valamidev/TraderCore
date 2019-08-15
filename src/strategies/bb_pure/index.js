"use strict"

const logger = require("../../logger")
const Abstract_Strategy = require("../absctract_strategy")

class Strategy extends Abstract_Strategy {
  constructor(
    config = {
      bb_period: 21,
      bb_up: 2.15,
      bb_down: 2.15,
      stop_loss_limit: 0.95
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
          this.BUY(candle.close)
        }

        // Sell
        if (candle.high > this.BUFFER.BB[this.step].upper) {
          this.SELL(candle.close)
        }
      }
    } catch (e) {
      logger.error("Strategy error ", e)
    }
  }
}

module.exports = Strategy
