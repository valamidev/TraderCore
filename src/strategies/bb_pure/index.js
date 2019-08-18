"use strict"

const logger = require("../../logger")
const Abstract_Strategy = require("../absctract_strategy")

class Strategy extends Abstract_Strategy {
  constructor(config = {}) {
    super()

    const bb_period = config.bb_period || 21
    const bb_up = config.bb_up || 2.15
    const bb_down = config.bb_down || 2.15

    // General Strategy config
    this.predict_on = 0
    this.learn = 1
    // General Strategy config

    // TA Indicators
    this.add_TA({
      label: "BB",
      update_interval: 1200,
      ta_name: "BB",
      params: {
        TimePeriod: bb_period,
        NbDevUp: bb_up,
        NbDevDn: bb_down
      },
      params2: "ohlcv/4"
    })
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.update_candle(candledata)

      if (this.TAready()) {
        let candle = candledata[60]

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
