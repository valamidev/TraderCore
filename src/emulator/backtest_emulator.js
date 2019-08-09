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
  async start(symbols, exchange, intervals, strategy, strategy_config, candledata = []) {
    try {
      this.simulations = await this.load_backtest(symbols, exchange)

      let promise_start = []

      for (let i = 0; i < this.simulations.length; i++) {
        // Set strategy and config
        this.simulations[i].strategy = strategy
        this.simulations[i].strategy_config = strategy_config

        // No initialized candledata
        if (candledata.length == 0) {
          candledata = await tradepairs.get_candlestick(this.simulations[i].exchange, this.simulations[i].symbol, intervals, this.config.back_test_limit)
        }

        this.simulations[i].emulator = new Emulator(this.simulations[i])

        // Start and load first chunk of candle data into the strategy
        promise_start.push(this.simulations[i].emulator.start(candledata))
      }

      await Promise.all(promise_start)

      logger.verbose(`Backtest emulators loaded succesfuly, count: ${this.simulations.length} Strategy: ${strategy}`)

      await this.sync_performance()
      await this.sync_actions()

      if (this.config.live_update == 1 && this.data_gen == 0) {
        setInterval(async () => {
          await this.update_loop()
        }, 35000)
      }

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
  async update_loop() {
    try {
      let update_loop_promises = []
      let time = Date.now()

      for (let i = 0; i < this.simulations.length; i++) {
        update_loop_promises.push(this.single_update(i))
      }

      await Promise.all(update_loop_promises)

      logger.info(`Backtest strategies updated, count: ${this.simulations.length} , time: ${time} last_candle: ${this.simulations[0].emulator.last_update.time} `)

      await this.sync_performance()

      return
    } catch (e) {
      logger.error("Backtest Emulator update loop error ", e)
    }
  }

  /* Helper function for Update loop */
  async single_update(strategies_id) {
    try {
      let guid = strategies_id

      let candledata = await tradepairs.get_candlestick(this.simulations[guid].exchange, this.simulations[guid].symbol, this.simulations[guid].interval_sec, 10)

      await this.simulations[guid].emulator.update(candledata)

      // Save new advice otherwise Idle
      if (this.simulations[guid].emulator.last_advice !== this.simulations[guid].last_advice) {
        this.simulations[guid].last_advice = this.simulations[guid].emulator.last_advice
      }
    } catch (e) {
      logger.error("Backtest Emulator single update error ", e)
    }
  }

  async sync_actions() {
    this.actions = []

    this.simulations.map((simulation) => {
      this.actions.push(simulation.emulator.action_list)
    })
  }

  async sync_performance() {
    this.performance = []

    for (let i = 0; i < this.simulations.length; i++) {
      // Set strategy

      let singe_performance = [this.simulations[i].symbol, this.simulations[i].exchange, this.simulations[i].emulator.quote_balance]

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
