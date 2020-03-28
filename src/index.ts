require('dotenv').config();

require('./emitter');
require('./redis');
require('./exchange/ccxt_controller');

import { logger } from './logger';
import tradePairs from './tradepairs/tradepairs';
import liveEmulator from './emulator/live_emulator';
import Traderbot from './traderbot/traderbot';
import strategies from './strategies';

const { httpPort } = process.env;

import { HTTPServer } from './httpAPI/server';

const httpServer = new HTTPServer(Number(httpPort ?? 3000));

async function main(): Promise<void> {
  try {
    logger.info('Trader Bot Service loading...');

    // Evaluator.start();
    liveEmulator.start();
    await Traderbot.start();

    // Load HTTP handlers
    httpServer.httpBacktestHandler('backtest');
    httpServer.httpTradePairsAPI('candle', tradePairs);
    httpServer.httpStrategyAPI('strategies', strategies);

    logger.info('Trader Bot Service started!');
  } catch (err) {
    throw new Error(err);
  }
}

main().catch(err => {
  logger.error(`'Startup error, reason: ${err}`);
});
