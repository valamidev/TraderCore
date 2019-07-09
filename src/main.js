"use strict";
const logger = require("./logger");
const _ = require("lodash");
const HTTP_API = new (require("./httpAPI"))(process.env.http_port);

const tradepairs = require("./tradepairs/tradepairs");

async function main() {
  try {
    logger.info("Things started");

    if (process.env.evaluator == 1) {
      const Evaluator = require("./strategy_evaluator");

      Evaluator.start();

      //HTTP_API.add_evaluation("evaluation", Evaluator);
    }

    if (process.env.live_emulator == 1) {
      const Live_emulator = require("./emulator/live_emulator");

      Live_emulator.start();

      if (process.env.http_api == 1) {
        HTTP_API.add_live_strategyAPI("live", Live_emulator);
      }
    }

    if (process.env.backtest_emulator == 1) {
      const BacktestEmulator = require("./emulator/backtest_emulator");

      if (process.env.http_api == 1) {
        HTTP_API.add_backtestAPI("backtest", BacktestEmulator, tradepairs);
      }
    }

    if (process.env.traderbot == 1) {
      const trader_bot = require("./traderbot/traderbot");

      await trader_bot.start();

      if (process.env.http_api == 1) {
        HTTP_API.add_tradebotAPI("tradebot", trader_bot);
      }
    }

    if (process.env.http_api == 1) {
      const strategies = require("./strategies");

      HTTP_API.add_candlechartAPI("candle", tradepairs);
      HTTP_API.add_strategyAPI("strategies", strategies);
    }

    // Sentiment
    if (process.env.sentiment == 1) {
      const sentimentAPI = require("./sentiment/sentiment");
      let twitter_eth = await sentimentAPI.twitter_chart("BAT", 0, 3600);

      console.log(
        _.slice(twitter_eth, twitter_eth.length - 24, twitter_eth.length)
      );
    }

    // End of main
  } catch (e) {
    logger.error("Main error ", e);
  }
}

main();
