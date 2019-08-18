"use strict"

const _ = require("lodash")
const logger = require("../../logger")
const TA_indicators = require("../../indicators")

class Abstract_Strategy {
  constructor() {
    this.advice = ""
    this.BUFFER = {}
    this.TA = {}
    this.advice
    this.step = -1
    this.minimum_history = 100

    this.invervals = []
    this.candle_buffer = {
      60: []
    }

    // ML part
    this.trade_history = []
    this.current_trade = {
      buy_price: 0,
      sell_price: 0,
      buy_in: []
    }
  }

  get_TA(label) {
    return this.BUFFER[label][this.step]
  }

  get_TA_age(label) {
    return this.TA[label].last_update
  }

  TAready() {
    return this.step > this.minimum_history
  }

  update_candle(candledata) {
    this.update_TA(candledata)
  }

  update_TA(candledatas) {
    try {
      Object.keys(candledatas).map((interval) => {
        Object.keys(this.TA).map((label) => {
          if (Number(this.TA[label].update_interval) === Number(interval)) {
            this.TA[label].update(candledatas[interval], this.step)
          }
        })
      })

      this.update_BUFFER()
    } catch (e) {
      logger.error("Abstract_Strategy TA Update error ", e)
    }
  }

  update_BUFFER() {
    Object.keys(this.TA).map((label) => {
      this.BUFFER[label].push(this.TA[label].result)
    })
    this.step++ // SUPER IMPORTANT!!!!
  }

  add_CandleInterval(interval) {
    if (this.invervals.indexOf(interval) == -1) {
      this.invervals.push(interval)
      this.candle_buffer[interval] = []
    }
  }

  add_TA(config) {
    try {
      let label = config.label
      this.add_CandleInterval(config.update_interval)

      if (typeof this.BUFFER[label] == "undefined" && typeof this.TA[label] == "undefined") {
        this.TA[label] = new TA_indicators(config)

        this.add_BUFFER(label)
      }
    } catch (e) {
      logger.error("Abstract_Strategy Add TA error ", e)
    }
  }

  add_BUFFER(name) {
    if (typeof this.BUFFER[name] == "undefined") {
      this.BUFFER[name] = []
    }
  }

  snapshot_BUFFER(frame_length = 10) {
    try {
      let snapshot = []

      for (let k = frame_length; k >= 0; k--) {
        Object.keys(this.TA).map((label) => {
          if (this.TA[label].ta_name == "BB") {
            snapshot.push(this.BUFFER[label][this.step - k].upper)
            snapshot.push(this.BUFFER[label][this.step - k].lower)
          } else if (this.TA[label].ta_name == "DONCHIAN") {
            snapshot.push(this.BUFFER[label][this.step - k].min)
            snapshot.push(this.BUFFER[label][this.step - k].max)
            snapshot.push(this.BUFFER[label][this.step - k].middle)
          } else {
            snapshot.push(this.BUFFER[label][this.step - k])
          }
        })
      }

      return snapshot
    } catch (e) {
      logger.error("Abstract_Strategy ML_data_snapshot", e)
    }
  }

  reset_current_trade() {
    this.current_trade = {
      buy_in: [],
      buy_price: 0,
      sell_price: 0
    }
  }

  BUY(price /*, amount = "all"*/) {
    if (this.advice == "BUY") return

    // ML /* TODO add config! */
    this.current_trade.buy_price = price
    this.current_trade.buy_in = this.snapshot_BUFFER(7)

    this.advice = "BUY"
  }

  SELL(price /*, amount = "all"*/) {
    if (this.advice == "SELL") return

    if (this.current_trade.buy_in.length > 0) {
      this.advice = "SELL"

      this.current_trade.sell_price = price
      this.trade_history.push(this.current_trade)
      this.reset_current_trade()
    }
  }

  IDLE() {
    if (this.advice == "IDLE") return

    this.advice = "IDLE"
  }
}

module.exports = Abstract_Strategy
