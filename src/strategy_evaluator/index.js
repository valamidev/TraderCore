"use strict"
const _ = require("lodash")
const logger = require("../logger")
const { pool } = require("../database")
const strategies = require("../strategies/index")
const tradepairs = require("../tradepairs/tradepairs")

const Optimizer = require("../emulator/strategy_optimizer")

class Strategy_evaluator {
  constructor() {
    this.looptime = 12 * 3600 * 1000 //Every 12 hours!
    this.candle_limits = [400, 1000, 3000]
    this.test_count = 50
    // Load all strategies
    this.strategies = strategies
    this.base_interval = 60
  }

  async start() {
    try {
      this.update_evaluator_loop()
    } catch (e) {
      logger.error("Evaluator error ", e)
    }
  }

  async update_evaluator_loop() {
    try {
      // Check last evaluation time
      let last_update = await this.time_check()

      // If last update were long time ago run it gently!
      if (last_update + this.looptime < Date.now()) {
        await this.execution()
      }
    } catch (e) {
      logger.error("Evaluator update error!", e)
    } finally {
      setTimeout(() => {
        this.update_evaluator_loop()
      }, 3600 * 1000)
    }
  }

  async execution() {
    try {
      this.tradepairs = await this.load_tradepairs()

      const time = Date.now()

      for (let i = 0; i < this.tradepairs.length; i++) {
        const tradepair = this.tradepairs[i]

        const Candledata = await tradepairs.get_candlestick(tradepair.exchange, tradepair.symbol, this.base_interval, _.last(this.candle_limit))

        for (let k = 0; k < this.candle_limits.length; k++) {
          const limit = this.candle_limits[k]

          let candledata = _.takeRight(Candledata, limit)

          let config = {
            time,
            exchange: tradepair.exchange,
            symbols: tradepair.symbol,
            interval: this.base_interval,
            test_count: this.test_count,
            candle_limit: limit
          }

          this.evaluation(config, candledata)
        }

        logger.info(`Strategy evaluation finsihed for ${tradepair.symbol}`)
      }
    } catch (e) {
      logger.error("Evaluator execution error ", e)
    }
  }

  async evaluation(config, candledata) {
    try {
      for (let i = 0; i < this.strategies.length; i++) {
        const strategy = this.strategies[i].name

        let optimizer_config = config

        optimizer_config.strategy = strategy

        let optimizer = new Optimizer(optimizer_config)

        let responses = await optimizer.execute(candledata)

        let result = responses[0]

        result.symbol = config.symbols
        result.exchange = config.exchange
        result.interval = config.interval
        result.strategy = strategy

        result.time = config.time

        await this.save_results(result)
      }

      return
    } catch (e) {
      logger.error("Evaluation error", e)
    }
  }

  async save_results(response) {
    try {
      await pool.query(
        "INSERT INTO `trade_strategies_evaluation` (`symbol`, `exchange`, `interval_sec`, `candle_limit`, `strategy`, `strategy_config`, `performance`, `actions`, `time`) VALUES (?, ?, ?, ?, ?,?, ?, ?, ?);",
        [
          response.symbol,
          response.exchange,
          response.interval,
          response.candle_limit,
          response.strategy,
          JSON.stringify(response.config),
          response.sum_performance,
          JSON.stringify(response.actions),
          response.time
        ]
      )
    } catch (e) {
      logger.error("SQL error", e)
    }
  }

  async time_check() {
    try {
      let [rows] = await pool.query("SELECT time FROM `trade_strategies_evaluation` ORDER BY `trade_strategies_evaluation`.`time` DESC LIMIT 1;")

      if (rows.length > 0) {
        return rows[0].time
      }

      return 0
    } catch (e) {
      logger.error("SQL error", e)
    }
  }

  async load_tradepairs() {
    try {
      let [rows] = await pool.query("SELECT `symbol`,`exchange` FROM `tradepairs`;")

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }

  // API access

  // SELECT count(*),`symbol` from `trade_strategies_evaluation` WHERE `interval_sec` = 300 and `performance` > 1000 group by `symbol`;
  async featured_results(time = 0) {
    try {
      let [rows] = await pool.query(
        "SELECT count(*),`symbol` from `trade_strategies_evaluation` WHERE `interval_sec` = 300 and `performance` > 1000 and time > ? group by `symbol`;",
        [time]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }
}

module.exports = new Strategy_evaluator()
