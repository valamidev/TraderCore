"use strict"

const _ = require("lodash")
const logger = require("../logger")

class Emulator {
  constructor(config) {
    this.config = config
    /*
    Config example:
        {symbol: "ETHBTC",
        exchange: "binance",
        strategy: "data_gen2",
        strategy_config: null,
        interval: 300}
    */
    this.strategy = new (require("../strategies/" + this.config.strategy + "/"))(this.config.strategy_config)

    this.last_advice
    this.last_action
    this.next_action
    this.last_update_time = 0

    this.last_update = []

    this.quote_balance = 1000
    this.asset_balance = 0

    this.action_list = []

    this.state = "Loaded"
  }

  async start(candledata) {
    try {
      // Hot-start strategy
      await this.update(candledata)

      candledata = []

      this.state = "Ready"

      let result = {
        trade_history: this.strategy.trade_history,
        quote_balance: this.quote_balance
      }

      return result
    } catch (e) {
      logger.error("Emulator error ", e)
    }
  }

  // Price ticker update / Cannot be used for backtesting!
  async price_update() {}

  // Candledata / Orderbook update
  async update(candledata, orderbook = []) {
    try {
      let update_tick = 0

      for (let j = 0; j < candledata.length; j++) {
        // Avoid false update
        if (this.last_update_time >= candledata[j].time) {
          continue
        }
        // If Volume 0 nothing happen skip the update
        if (candledata[j].volume == 0) {
          this.last_update_time = candledata[j].time
          continue
        }

        // Strategy update!
        await this.strategy.update(candledata[j])
        // Strategy update!

        if (this.next_action !== this.last_action) {
          this.emulator_action(candledata[j], this.next_action)

          this.last_action = this.next_action
        }

        if (this.strategy.advice !== this.last_advice) {
          this.next_action = this.strategy.advice

          this.last_advice = this.strategy.advice
        }

        // Set last update time avoid multiple update
        this.last_update_time = candledata[j].time
        this.last_update = candledata[j]
        update_tick++
      }

      candledata = []

      return update_tick
    } catch (e) {
      logger.error("Emulator error ", e)
    }
  }

  async emulator_action(candledata_single, action) {
    const fee = 1.001 //1.001;

    if (action == "BUY" && this.quote_balance > 0) {
      this.asset_balance = this.quote_balance / candledata_single.open / fee
    }

    if (action == "SELL" && this.asset_balance > 0) {
      this.quote_balance = (this.asset_balance * candledata_single.open) / fee
    }

    // Save actions for later use
    this.action_list.push({
      symbol: this.config.symbol,
      action,
      price: candledata_single.open,
      quote_balance: this.quote_balance,
      time: candledata_single.time
    })
  }
}

module.exports = Emulator
