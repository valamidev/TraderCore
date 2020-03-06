require('dotenv').config();

require('./emitter');
require('./redis');
require('./exchange/ccxt_controller');

import { logger } from './logger';
// import tradePairs from './tradepairs/tradepairs';
import liveEmulator from './emulator/live_emulator';
// import { BacktestEmulator } from './emulator/backtest_emulator';
import Traderbot from './traderbot/traderbot';
// import strategies from './strategies';

const { httpPort } = process.env;

const httpAPIHandler = new (require('./httpAPI'))(httpPort ?? 3000);

async function main(): Promise<void> {
  try {
    logger.info('Trader Bot Service loading...');

    // Evaluator.start();
    liveEmulator.start();
    await Traderbot.start();

    // Load HTTP handlers
    //  httpAPIHandler.add_live_strategyAPI('live', liveEmulator);
    httpAPIHandler.httpBacktestHandler('backtest');
    // httpAPIHandler.add_candlechartAPI('candle', tradePairs);
    // httpAPIHandler.add_strategyAPI('strategies', strategies);

    logger.info('Trader Bot Service started!');
  } catch (err) {
    throw new Error(err);
  }
}

main().catch(err => {
  logger.error(`'Startup error, reason: ${err}`);
});
