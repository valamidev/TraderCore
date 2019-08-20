"use strict"
const _ = require("lodash")
const logger = require("../logger")
const tradepairs = require("../tradepairs/tradepairs")
const BacktestEmulator = require("./backtest_emulator")
const strategies = require("../strategies/index")

class Optimizer {
  constructor(config) {
    this.config = config
    this.candledata = {}
  }

  load_base_config(name) {
    let stategy_info = strategies.find((elem) => elem.name === name)

    return stategy_info.config
  }

  config_optimizer(config) {
    let new_config = {}

    Object.entries(config).map((elem) => {
      /* 
     elem[1][0] = min 
     elem[1][1]elem[1] = max 
     elem[1][2] = type 
     elem[1][3] = round (if type == float) */
      let value = elem[1][0] + (elem[1][1] - elem[1][0]) * Math.random()

      if (elem[1][2] === "float") {
        value = _.round(value, elem[1][3])
      }

      if (elem[1][2] === "int") {
        value = parseInt(value, elem[1][3])
      }

      new_config[elem[0]] = value

      return
    })

    return new_config
  }

  async execute() {
    try {
      const conf = this.config

      let responses = []
      let promises = []
      let backtest_list = []
      let backtest_strategy_config = []
      let base_config = this.load_base_config(conf.strategy)

      // Add ever possible intervals
      const intervals = [60, 120, 180, 300, 600, 900, 1200, 1800, 3600, 3600 * 3, 3600 * 6, 3600 * 12, 3600 * 24, 3600 * 48, 3600 * 72, 3600 * 24 * 7]

      this.candledata = await tradepairs.get_batched_candlestick({
        exchange: conf.exchange,
        symbol: conf.symbols,
        intervals_time: intervals,
        limit: conf.candle_limit
      })

      for (let i = 0; i < conf.test_count; i++) {
        backtest_list[i] = new BacktestEmulator({ file_name: "" })

        // Create randomized config
        backtest_strategy_config[i] = this.config_optimizer(base_config)

        promises.push(
          backtest_list[i].start({
            symbols: conf.symbols,
            exchange: conf.exchange,
            strategy: conf.strategy,
            strategy_config: backtest_strategy_config[i],
            trader_config: conf.trader_config,
            candledata: this.candledata
          })
        )
      }

      await Promise.all(promises)

      for (let i = 0; i < conf.test_count; i++) {
        responses.push({
          strategy: conf.strategy,
          candle_limit: conf.candle_limit,
          config: backtest_strategy_config[i],
          actions: backtest_list[i].actions,
          performance: backtest_list[i].performance,
          num_actions: backtest_list[i].actions[0].length,
          sum_performance: _.sumBy(backtest_list[i].performance, 2)
        })
      }

      responses = _.orderBy(responses, ["sum_performance"])

      return responses
    } catch (e) {
      logger.error("Strategy Optimizer error ", e)
    }
  }
}
module.exports = Optimizer
