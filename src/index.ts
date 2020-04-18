/* eslint-disable import/first */
require('dotenv').config();

require('./emitter');
require('./redis');
require('./exchange/ccxt_controller');

import { logger } from './logger';

import liveEmulator from './emulator/live_emulator';
import Traderbot from './traderbot/traderbot';

const { httpPort } = process.env;

import { bootstrap } from './httpserver';

// const httpServer = new HTTPServer(Number(httpPort ?? 3000));

async function main(): Promise<void> {
  try {
    logger.info('Trader Bot Service loading...');

    liveEmulator.start();
    await Traderbot.start();

    await bootstrap(Number(httpPort ?? 3000));

    logger.info('Trader Bot Service started!');
  } catch (err) {
    throw new Error(err);
  }
}

main().catch(err => {
  logger.error(`'Startup error, reason: ${err}`);
});
