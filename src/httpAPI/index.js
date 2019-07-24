"use strict"
const _ = require("lodash")
const logger = require("../logger")
const Koa = require("koa")
const Router = require("koa-router")
const parse = require("co-body")
const cors = require("@koa/cors")
const Optimizer = require("../emulator/strategy_optimizer")
const fs = require("fs")

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

    router.post("/masstest", async (ctx, next) => {
      let post = await parse(ctx)

      logger.verbose(JSON.stringify(post))

      let config = {}

      config.strategy = post.strategy
      config.symbols = post.symbol
      config.exchange = post.exchange
      config.interval = post.interval
      config.candle_limit = post.candle_limit
      config.test_count = post.test_count
      //
      let responses = []
      //

      // Backtest execute, speed up with pre-fetch candledata
      let candledata = await tradepairs.get_candlestick(config.exchange, config.symbols, config.interval, config.candle_limit)

      // Strategy optimizer, helper function
      let optimizer = new Optimizer(config)

      responses = await optimizer.execute(candledata)

      ctx.body = {
        post_body: post,
        test_results: _.reverse(responses),
        candledata: candledata
      }
    })

    router.get("/test", async (ctx, next) => {
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

    router.get("/ordertest", async (ctx, next) => {
      await tradebot.api_update_trade_instance(11, {
        action: "BUY",
        quantity: 0,
        close: 0.0003186
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

    router.get("/performance", async (ctx, next) => {
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
    router.get("/all", async (ctx, next) => {
      ctx.body = strategies
    })

    app.use(router.routes()).use(router.allowedMethods())
  }

  add_candlechartAPI(name, tradepairs) {
    let router = new Router({
      prefix: `/${name}`
    })

    router.get("/tradepairs", async (ctx, next) => {
      ctx.body = await tradepairs.load_tradepairs()
    })

    /*  router.get("/status", (ctx, next) => {
      ctx.body = tensorflow_object.status;
    });

    router.post("/predict", async (ctx, next) => {
      try {
        let post_data = await parse(ctx);

        let input_data = utils.trade_singal_input(post_data.input, 4);

        ctx.body = await tensorflow_object.api_get_predict(input_data);
      } catch (e) {
        ctx.throw(400, "Predict error", e);
      }
    });*/

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods())
  }
}

module.exports = HttpAPI
