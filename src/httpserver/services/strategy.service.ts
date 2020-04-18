import { Injectable } from '@nestjs/common';
import { STRATEGIES, StrategyInfo } from '../../strategies';

@Injectable()
export class StrategyService {
  getAll(): StrategyInfo[] {
    return STRATEGIES;
  }
}
