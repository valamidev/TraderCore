/* eslint-disable require-atomic-updates */

import _ from 'lodash';
import { logger } from '../logger';
import Koa from 'koa';
import Router from 'koa-router';
//import parse from 'co-body';
import cors from '@koa/cors';
//import { StrategyOptimizer } from '../emulator/strategy_optimizer';
import tradePairs from '../tradepairs/tradepairs';
import { BacktestEmulator } from '../emulator/backtest_emulator';
import { DEFAULT_TRADER_CONFIG } from 'src/constants';

const app = new Koa();
app.use(cors());

class HttpAPI {
  constructor(port: number) {
    app.listen(port);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpBacktestHandler(name: string): void {
    const router = new Router({
      prefix: `/${name}`,
    });

    /*
    router.post('/masstest', async ctx => {
      const post = await parse(ctx);

      logger.verbose(JSON.stringify(post));

      const config = {};

      config.exchange = post.exchange;
      config.symbols = post.symbol;
      config.strategy = post.strategy;
      config.candleLimit = Number(post.candleLimit);
      config.test_count = Number(post.test_count);
      config.traderConfig = { stopLossLimit: 0.97, trailingLimit: 0.02, portionPct: 20 };
      let responses = [];

      // Strategy optimizer, helper function
      let optimizer = new StrategyOptimizer(config);

      responses = await optimizer.execute();

      let candledata = [];

      Object.keys(optimizer.candledata).map(time => {
        if (optimizer.candledata[time][300]) {
          candledata.push(optimizer.candledata[time][300]);
        }
      });

      let response = {
        post_body: post,
        test_results: _.reverse(responses),
        candledata,
      };

      ctx.body = response;

      return;
    }); */

    router.get('/test', async ctx => {
      try {
        const Backtest = new BacktestEmulator();

        const candledata = await tradePairs.getBatchedCandlestickMap('binance', 'BTC/USDT', [60, 300, 1200], 3000);

        if (candledata) {
          await Backtest.start({
            exchange: 'binance',
            symbol: 'BTC/USDT',
            strategy: 'bb_pure',
            strategyConfig: {},
            intervals: [60, 300, 1200],
            traderConfig: DEFAULT_TRADER_CONFIG,
            candledata,
            // traderConfig: { stopLossLimit: -1, trailingLimit: -1, portionPct: 30 }
          });

          const response = {
            actions: Backtest.actions,
            performance: Backtest.performance,
            // sumPerformance: _.sumBy(Backtest.performance, 2),
          };

          ctx.body = response;
        }
      } catch (err) {
        logger.error(``);
      }
    });

    app.use(router.routes()).use(router.allowedMethods());
  }
  /*
  add_live_strategyAPI(name, liveEmulator) {
    const router = new Router({
      prefix: `/${name}`,
    });

    router.get('/performance', async ctx => {
      ctx.body = await liveEmulator.getStrategiesPerformance();
    });

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods());
  }

  add_strategyAPI(name, strategies) {
    const router = new Router({
      prefix: `/${name}`,
    });

    // http://localhost:3001/strategies/all
    router.get('/all', async ctx => {
      ctx.body = strategies;
    });

    app.use(router.routes()).use(router.allowedMethods());
  }

  add_candlechartAPI(name, tradePairs) {
    const router = new Router({
      prefix: `/${name}`,
    });

    router.get('/tradePairs', async ctx => {
      ctx.body = await tradePairs.loadAvailableTradePairs();
    });

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods());
  }
  */
}

module.exports = HttpAPI;
