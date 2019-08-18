"use strict"
const logger = require("../logger")
const util = require("../utils")
const _ = require("lodash")
const tradepairs = require("../tradepairs/tradepairs")
const Emulator = require("./emulator")
const { pool } = require("../database")

class BacktestEmulator {
  constructor(config) {
    this.config = config

    this.data_gen = 0
    this.simulations = []
    this.performance = []
    this.actions = []

    if (this.config.file_name != "") {
      this.data_gen = 1
      util.file_create(this.config.file_name)
    }
  }

  // Start backtest instances
  async start(config = {} /*symbols, exchange, strategy, strategy_config, trader_config, candledata = []*/) {
    try {
      let symbols = config.symbols || ["BTC/USDT"]
      let exchange = config.exchange || "binance"
      let strategy = config.strategy || ""
      let strategy_config = config.strategy_config || {}
      let trader_config = config.trader_config || {}
      let candledata = config.candledata || []

      this.simulations = await this.load_backtest(symbols, exchange)

      let promise_start = []

      for (let i = 0; i < this.simulations.length; i++) {
        // Set strategy and config
        this.simulations[i].strategy = strategy
        this.simulations[i].strategy_config = strategy_config
        this.simulations[i].trader_config = trader_config

        this.simulations[i].emulator = new Emulator(this.simulations[i])

        let update_intervals = this.simulations[i].emulator.update_intervals

        // No initialized candledata
        if (candledata.length == 0) {
          this.simulations[i].candledata = await tradepairs.get_batched_candlestick({
            exchange: this.simulations[i].exchange,
            symbol: this.simulations[i].symbol,
            intervals_time: update_intervals,
            limit: this.config.back_test_limit
          })
        } else {
          this.simulations[i].candledata = candledata
        }

        logger.verbose(`Backtest Candledata length: ${this.simulations[i].candledata.length}`)

        // Start and load first chunk of candle data into the strategy
        promise_start.push(this.simulations[i].emulator.start(this.simulations[i].candledata))
      }

      await Promise.all(promise_start)

      logger.verbose(`Backtest emulators loaded succesfuly, count: ${this.simulations.length} Strategy: ${strategy}`)

      await this.sync_performance()
      await this.sync_actions()

      if (this.data_gen == 1) {
        await this.save_histories()
        logger.info(`Backtest histories saved!`)
      }

      return
    } catch (e) {
      logger.error("Backtest Emulator start error ", e)
    }
  }

  /* Mass update on all strategy  */

  async sync_actions() {
    this.actions = []

    this.simulations.map((simulation) => {
      this.actions.push(simulation.emulator.trade_emulator.orders)
    })
  }

  async sync_performance() {
    this.performance = []

    for (let i = 0; i < this.simulations.length; i++) {
      // Set strategy

      let singe_performance = [this.simulations[i].symbol, this.simulations[i].exchange, this.simulations[i].emulator.trade_emulator.full_balance()]

      this.performance.push(singe_performance)
    }
  }

  async save_histories() {
    let histories = []

    for (let i = 0; i < this.simulations.length; i++) {
      histories.push(this.simulations[i].emulator.strategy.trade_history)
    }

    util.file_append(this.config.file_name, JSON.stringify(histories))
  }

  async load_backtest(symbols, exchange) {
    try {
      let [rows] = await pool.query(
        "SELECT m.exchange,m.id,m.symbol,m.baseId,m.quoteId FROM `tradepairs` as t JOIN `market_datas` as m ON t.symbol = m.symbol AND t.exchange = m.exchange WHERE m.`exchange` = ? and  m.`symbol` IN (?);",
        [exchange, symbols]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }
}

module.exports = BacktestEmulator
