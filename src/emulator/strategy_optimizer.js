"use strict"
const _ = require("lodash")
const logger = require("../logger")
const BacktestEmulator = require("./backtest_emulator")
const strategies = require("../strategies/index")

class Optimizer {
  constructor(config) {
    this.config = config
  }

  load_base_config(name) {
    let stategy_info = strategies.filter((elem) => elem.name === name)[0]

    return stategy_info.config
  }

  config_optimizer(config) {
    let new_config = {}

    Object.entries(config).map((elem) => {
      /* 
     elem[1][0] = min 
     elem[1][1]lem[1] = max 
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

  async execute(candledata) {
    try {
      const conf = this.config

      let responses = []
      let promises = []
      let backtest_list = []
      let backtest_config = []
      let candle_limit = candledata.length

      let base_config = this.load_base_config(conf.strategy)

      for (let i = 0; i < conf.test_count; i++) {
        backtest_list[i] = new BacktestEmulator({ file_name: "" })

        // Create randomized config
        backtest_config[i] = this.config_optimizer(base_config)

        promises.push(backtest_list[i].start(conf.symbols, conf.exchange, conf.interval, conf.strategy, backtest_config[i], candledata))
      }

      await Promise.all(promises)

      for (let i = 0; i < conf.test_count; i++) {
        responses.push({
          strategy: conf.strategy,
          candle_limit,
          config: backtest_config[i],
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
