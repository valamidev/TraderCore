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

      config.exchange = post.exchange
      config.symbols = post.symbol
      config.strategy = post.strategy
      config.candle_limit = Number(post.candle_limit)
      config.test_count = Number(post.test_count)
      config.trader_config = { stop_loss_limit: 0.98, trailing_limit: 0.01, portion_pct: 25 }
      let responses = []

      // Strategy optimizer, helper function
      let optimizer = new Optimizer(config)

      responses = await optimizer.execute()

      let candledata = []

      Object.keys(optimizer.candledata).map((time) => {
        if (optimizer.candledata[time][300]) {
          candledata.push(optimizer.candledata[time][300])
        }
      })

      let response = {
        post_body: post,
        test_results: _.reverse(responses),
        candledata
      }

      ctx.body = response

      return
    })

    router.get("/test", async (ctx) => {
      let Backtest = new BacktestEmulator({
        back_test_limit: 30000000,
        file_name: "" //"backtest_data_gen.tf",
      })

      const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "NEO/USDT", "ETH/BTC", "XRP/USDT", "EOS/BTC", "XMR/BTC"]

      await Backtest.start({
        symbols,
        exchange: "binance",
        strategy: "bb_pure",
        trader_config: { stop_loss_limit: 0.98, trailing_limit: 0.02, portion_pct: 10 }
      })

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
