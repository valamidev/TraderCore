/* eslint-disable require-atomic-updates */

import _ from 'lodash';
import { logger } from '../logger';
import Koa from 'koa';
import Router from 'koa-router';
import parse from 'co-body';
import cors from '@koa/cors';
import { StrategyOptimizer } from '../emulator/strategy_optimizer';
import tradePairs from '../tradepairs/tradepairs';
import { BacktestEmulator } from '../emulator/backtest_emulator';
import { DEFAULT_TRADER_CONFIG, DEFAULT_STRATEGY_OPTIMIZER_INTERVALS } from '../constants';

const app = new Koa();
app.use(cors());

export class HTTPServer {
  constructor(port: number) {
    app.listen(port);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpBacktestHandler(name: string): void {
    const router = new Router({
      prefix: `/${name}`,
    });

    router.post('/masstest', async ctx => {
      try {
        const post = await parse(ctx);

        logger.verbose(JSON.stringify(post));

        /*
      symbol: "BTC/USDT"
      exchange: "binance"
      candle_limit: 1000
      numberOfExecution: 100
      strategy: "bb_pure"
      config: {}
            */
        const config: any = {};

        config.exchange = post.exchange ?? 'binance';
        config.symbol = post.symbol ?? 'BTC/USDT';
        config.strategy = post.strategy ?? 'bb_pure';
        config.candleLimit = Number(post.candleLimit) || 1000;
        config.numberOfExecution = Number(post.numberOfExecution) || 10;

        const candleData = await tradePairs.getBatchedCandlestickMap(config.exchange as string, config.symbol as string, DEFAULT_STRATEGY_OPTIMIZER_INTERVALS, 3000);

        if (candleData) {
          // Strategy optimizer, helper function
          const optimizer = new StrategyOptimizer({
            exchange: config.exchange as string,
            symbol: config.symbol as string,
            numberOfExecution: config.numberOfExecution,
            strategy: config.strategy,
            traderConfig: DEFAULT_TRADER_CONFIG,
            candledata: candleData,
          });

          const optimizerResult = await optimizer.execute();

          const candleDataForChart = Object.keys(candleData)
            .map(time => {
              if (candleData[time][300]) {
                return candleData[time][300];
              }
            })
            .filter(elem => elem !== undefined);

          const response = {
            // eslint-disable-next-line @typescript-eslint/camelcase
            post_body: post,
            // eslint-disable-next-line @typescript-eslint/camelcase
            test_results: _.reverse(optimizerResult),
            candledata: candleDataForChart,
          };

          ctx.body = response;
        }
        return;
      } catch (err) {
        logger.error(`HTTP API Error`);
      }
    });

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
            historyOrders: Backtest.historyOrders,
            performance: Backtest.performance,
            // sumPerformance: _.sumBy(Backtest.performance, 2),
          };

          ctx.body = response;
        }
      } catch (err) {
        logger.error(`HTTP API Error`);
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
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpStrategyAPI(name: string, strategies: any): void {
    const router = new Router({
      prefix: `/${name}`,
    });

    // http://localhost:3001/strategies/all
    router.get('/all', async ctx => {
      ctx.body = strategies;
    });

    app.use(router.routes()).use(router.allowedMethods());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpTradePairsAPI(name: string, tradePairs: any): void {
    const router = new Router({
      prefix: `/${name}`,
    });

    router.get('/tradePairs', async ctx => {
      ctx.body = await tradePairs.loadAvailableTradePairs();
    });

    // Update new routes
    app.use(router.routes()).use(router.allowedMethods());
  }
}
