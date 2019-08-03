"use strict"
const logger = require("./logger")

const { evaluator, live_emulator, http_api, backtest_emulator, traderbot, sentiment, account, http_port } = process.env

const tradepairs = require("./tradepairs/tradepairs")
const HTTP_API = new (require("./httpAPI"))(http_port)

async function main() {
  try {
    logger.info("Things started")

    if (evaluator == 1) {
      const Evaluator = require("./strategy_evaluator")

      Evaluator.start()

      //HTTP_API.add_evaluation("evaluation", Evaluator);
    }

    if (live_emulator == 1) {
      const Live_emulator = require("./emulator/live_emulator")

      Live_emulator.start()

      if (http_api == 1) {
        HTTP_API.add_live_strategyAPI("live", Live_emulator)
      }
    }

    if (backtest_emulator == 1) {
      const BacktestEmulator = require("./emulator/backtest_emulator")

      if (http_api == 1) {
        HTTP_API.add_backtestAPI("backtest", BacktestEmulator, tradepairs)
      }
    }

    if (traderbot == 1) {
      const exchanges = require("./exchange/ccxt_controller")
      const trader_bot = require("./traderbot/traderbot")

      await trader_bot.start()

      if (http_api == 1) {
        HTTP_API.add_tradebotAPI("tradebot", trader_bot)
      }
    }

    if (http_api == 1) {
      const strategies = require("./strategies")

      HTTP_API.add_candlechartAPI("candle", tradepairs)
      HTTP_API.add_strategyAPI("strategies", strategies)
    }

    if (account == 1) {
      const Accounts = require("./accounts")

      Accounts.start()
    }

    if (sentiment == 1) {
      const sentimentAPI = require("./sentiment/sentiment")
      let twitter_eth = await sentimentAPI.twitter_chart("BAT", 0, 3600)

      /*   console.log(
        _.slice(twitter_eth, twitter_eth.length - 24, twitter_eth.length)
      );*/
    }

    // End of main
  } catch (e) {
    logger.error("Main error ", e)
  }
}

main()
