import { Module } from '@nestjs/common';
import { TradepairsService } from './services/tradepairs.service';
import { TradepairsController } from './controllers/tradepairs.controller';
import { StrategyService } from './services/strategy.service';
import { StrategyController } from './controllers/strategy.controller';
import { BacktestService } from './services/backtest.service';
import { BacktestController } from './controllers/backtest.controller';
import { GridbotService } from './services/gridbot.service';
import { GridbotController } from './controllers/gridbot.controller';

@Module({
  providers: [TradepairsService, StrategyService, BacktestService, GridbotService],
  controllers: [TradepairsController, StrategyController, BacktestController, GridbotController],
})
export class MainModule { }
