/* eslint-disable require-atomic-updates */
"use strict"
const _ = require("lodash")
const logger = require("../logger")
const Koa = require("koa")
const Router = require("koa-router")
const parse = require("co-body")
const cors = require("@koa/cors")
const Optimizer = require("../emulator/strategy_optimizer")

const app = new Koa()
app.use(cors())

class HttpAPI {
  constructor(port) {
    app.listen(port)
  }

  add_backtestAPI(name, BacktestEmulator, tradepairs) {
    let router = new Router({
      prefix: `/${name}`
    })

    router.post("/masstest", async (ctx) => {
      let post = await parse(ctx)

      logger.verbose(JSON.stringify(post))

      let config = {}

      post.chart_type = "candlestick"

      config.exchange = post.exchange
      // config.chart_type = post.chart_type
      config.symbols = post.symbol
      config.interval = Number(post.interval)

      config.strategy = post.strategy

      config.candle_limit = Number(post.candle_limit)
      config.test_count = Number(post.test_count)
      //

      // Backtest execute, speed up with pre-fetch candledata
      let candledata = []
      let responses = []

      /* TODO REMOVE AND MOVE THIS TO CLIENT SIDE */
      if ([16, 32, 64, 128, 256, 512, 1024].indexOf(config.interval) >= 0) {
        config.chart_type = "tickchart"
        let time_limit = Date.now() - config.candle_limit * 60 * 1000

        // TODO remove
        let request_limit = 50000

        candledata = await tradepairs.get_tickchart(config.exchange, config.symbols, config.interval, request_limit, time_limit)
      } else {
        config.chart_type = "candlestick"
        candledata = await tradepairs.get_candlestick(config.exchange, config.symbols, config.interval, config.candle_limit)
      }

      // let candledata = await tradepairs.get_tickchart(config.exchange, config.symbols, 300)

      // Strategy optimizer, helper function
      let optimizer = new Optimizer(config)

      responses = await optimizer.execute(candledata)

      let response = {
        post_body: post,
        test_results: _.reverse(responses),
        candledata: candledata
      }

      ctx.body = response

      return
    })

    router.get("/test", async (ctx) => {
      let Backtest = new BacktestEmulator({
        back_test_limit: 3000,
        file_name: "", //"backtest_data_gen.tf",
        live_update: 0
      })

      const symbols = ["BTC/USDT"]

      await Backtest.start(symbols, "binance", 240, "turtle")

      let response = {
        actions: Backtest.actions,
        performance: Backtest.performance,
        sum_performance: _.sumBy(Backtest.performance, 2),
        count_of_simulations: Backtest.simulations.length
      }

      ctx.body = response
    })

    app.use(router.routes()).use(router.allowedMethods())
  }

  add_tradebotAPI(name, tradebot) {
    let router = new Router({
      prefix: `/${name}`
    })

    router.get("/ordertest", async (ctx) => {
      await tradebot.api_update_trade_instance(11, {
        action: "SELL",
        quantity: 1,
        close: 0.00033
      })

      ctx.body = "Done"
    })

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods())
  }

  add_live_strategyAPI(name, live_emulator) {
    let router = new Router({
      prefix: `/${name}`
    })

    router.get("/performance", async (ctx) => {
      ctx.body = await live_emulator.get_performance()
    })

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods())
  }

  add_strategyAPI(name, strategies) {
    let router = new Router({
      prefix: `/${name}`
    })

    // http://localhost:3001/strategies/all
    router.get("/all", async (ctx) => {
      ctx.body = strategies
    })

    app.use(router.routes()).use(router.allowedMethods())
  }

  add_candlechartAPI(name, tradepairs) {
    let router = new Router({
      prefix: `/${name}`
    })

    router.get("/tradepairs", async (ctx) => {
      ctx.body = await tradepairs.load_tradepairs()
    })

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods())
  }
}

module.exports = HttpAPI
