"use strict"

const _ = require("lodash")
const logger = require("../../logger")

// Indicators
const RSI = require("../utils/indicators/RSI")
const BB = require("../utils/indicators/BB")
const OBI = require("../utils/indicators/OBI")
const X_SMMA = require("../utils/indicators/CROSS_SMMA")
const TRIX = require("../utils/indicators/TRIX")
const OHCL4 = require("../utils/indicators/OHCL4")
const SMA = require("../utils/indicators/SMA")
const MACD = require("../utils/indicators/MACD")
const WA = require("../utils/indicators/WA")
const CCI = require("../utils/indicators/CCI")

// Stoploss
const STOPLOSS = require("../utils/indicators/STOPLOSS")

class Strategy {
  constructor(
    config = {
      mul_cci_100: 0.7,
      mul_cci_200: 0.7,
      mul_cci_n100: 0.7,
      mul_cci_n200: 0.7,
      stop_loss_limit: 0.92
    }
  ) {
    // General Strategy config
    this.advice
    this.step = 0
    this.minimum_history = 100
    // General Strategy config

    // Strategy config
    this.mul_cci_100 = config.mul_cci_100
    this.mul_cci_200 = config.mul_cci_200
    this.mul_cci_n100 = config.mul_cci_n100
    this.mul_cci_n200 = config.mul_cci_n200

    this.stop_loss_limit = config.stop_loss_limit
    // Strategy config

    // Indicators
    this.bb = new BB({ TimePeriod: 21, NbDevUp: 1.7, NbDevDn: 1.7 })
    this.rsi = new RSI(21)
    this.obi = new OBI(15)
    this.x_smma = new X_SMMA({ short: 10, long: 20 })
    this.trix = new TRIX(18)
    this.ohcl4 = new OHCL4()
    this.sma = new SMA(5)
    this.macd = new MACD({ short: 12, long: 26, signal: 5 })
    this.wa = new WA({
      jawLength: 13,
      teethLength: 8,
      lipsLength: 5,
      jawOffset: 8,
      teethOffset: 5,
      lipsOffset: 3
    })
    this.cci_long = new CCI({ constant: 0.015, history: 50 })
    this.cci_short = new CCI({ constant: 0.015, history: 14 })

    //Stoploss
    this.stop_loss = new STOPLOSS(this.stop_loss_limit)
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
      sma: [],
      macd_result: [],
      macd_signal: [],
      wa: [],
      cci_long: [],
      cci_short: []
    }
    // Buffer

    // Machine learning buffer!
    this.trade_history = []

    this.current_trade = {
      buy_price: 0,
      sell_price: 0,
      buy_in: [],
      time_history: []
    }
  }

  reset_current_trade() {
    this.current_trade = {
      buy_in: [],
      time_history: [],
      buy_price: 0,
      sell_price: 0
    }
  }

  update_buffer(candle) {
    // Candle Buffer
    this.BUF.candle.push(candle)

    // Middle price ( open + high + close + low / 4)
    this.ohcl4.update(candle)
    this.BUF.candle_mid.push(this.ohcl4.result)

    // BB
    this.bb.update(this.ohcl4.result)
    this.BUF.bb_upper.push(this.bb.upper)
    this.BUF.bb_lower.push(this.bb.lower)
    this.BUF.bb_middle.push(this.bb.middle)
    // Cross SMMA
    this.x_smma.update(this.ohcl4.result)
    this.BUF.x_smma.push(this.x_smma.result)
    // TRIX
    this.trix.update(this.ohcl4.result)
    this.BUF.trix.push(this.trix.result)
    // RSI
    this.rsi.update(candle)
    this.BUF.rsi.push(this.rsi.result)
    // OBI
    this.obi.update(candle)
    this.BUF.obi.push(this.obi.result)
    // SMA
    this.sma.update(this.ohcl4.result)
    this.BUF.sma.push(this.sma.result)
    // MACD
    this.macd.update(this.ohcl4.result)
    this.BUF.macd_result.push(this.macd.result)
    this.BUF.macd_signal.push(this.macd.signal.result)
    // WA
    this.wa.update(candle)
    this.BUF.wa.push(this.wa.result)
    // CCI
    this.cci_long.update(candle)
    this.BUF.cci_long.push(this.cci_long.result)
    this.cci_short.update(candle)
    this.BUF.cci_short.push(this.cci_short.result)

    // Stop loss
    this.stop_loss.update(this.BUF.candle[this.step])
  }

  async BUY() {
    if (this.advice == "BUY") {
      return
    }

    this.advice = "BUY"
    this.stop_loss.updatePrice(this.BUF.candle[this.step])
  }

  async SELL() {
    if (this.advice == "SELL") {
      return
    }

    this.advice = "SELL"
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.update_buffer(candledata)

      if (this.step > this.minimum_history) {
        // Strategy loaded

        // Stop loss sell
        if (this.stop_loss.action == "stoploss") {
          await this.SELL()
        }

        let signal = this.cci_signal()

        if (
          this.BUF.wa[this.step].jaw > this.BUF.wa[this.step].signal &&
          this.BUF.wa[this.step].teeth > this.BUF.wa[this.step].signal &&
          this.BUF.wa[this.step].lips > this.BUF.wa[this.step].signal &&
          signal == "BUY"
        ) {
          await this.BUY()
        }

        if (
          this.BUF.wa[this.step].jaw < this.BUF.wa[this.step].signal &&
          this.BUF.wa[this.step].teeth < this.BUF.wa[this.step].signal &&
          this.BUF.wa[this.step].lips < this.BUF.wa[this.step].signal &&
          signal == "SELL"
        ) {
          await this.SELL()
        }
      }
    } catch (e) {
      logger.error("Emulator error ", e)
    } finally {
      // Successful update increase step
      this.step++
    }
  }

  cci_signal() {
    let signal = ""

    if (this.BUF.cci_long[this.step] < -200 * this.mul_cci_n200 && this.BUF.cci_short[this.step] < -100 * this.mul_cci_n100) {
      signal = "BUY"
    }

    if (this.BUF.cci_long[this.step] > 200 * this.mul_cci_200 && this.BUF.cci_short[this.step] > 100 * this.mul_cci_100) {
      signal = "SELL"
    }

    return signal
  }

  macd_signal(step_count) {
    let buy_count = 0
    let sell_count = 0

    // Buy signal
    if (this.BUF.macd_result[this.step] > this.BUF.macd_signal[this.step]) {
      for (let i = step_count; i > 0; i--) {
        if (this.BUF.macd_result[this.step - i] < this.BUF.macd_signal[this.step - i]) {
          buy_count++
        }
      }
    }

    // Sell signal

    if (this.BUF.macd_result[this.step] < this.BUF.macd_signal[this.step]) {
      for (let i = step_count; i > 0; i--) {
        if (this.BUF.macd_result[this.step - i] > this.BUF.macd_signal[this.step - i]) {
          sell_count++
        }
      }
    }

    return { buy: buy_count, sell: sell_count }
  }
}

module.exports = Strategy
