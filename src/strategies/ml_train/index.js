const logger = require('../../logger');
const AbstractStrategy = require('../absctract_strategy');

class Strategy extends AbstractStrategy {
  constructor(config = {}) {
    super();

    this.rsi_buy = config.rsi_buy || 30;
    this.rsi_sell = config.rsi_sell || 70;

    // General Strategy config
    this.predict_on = 0;
    this.learn = 1;
    // General Strategy config

    // TA Indicators
    this.addNeWTA({ label: 'RSI', update_interval: 60, ta_name: 'RSI', params: 15, params2: '' });
    this.addNeWTA({ label: 'MACD', update_interval: 60, ta_name: 'MACD', params: { short: 12, long: 26, signal: 9 }, params2: '' });
    this.addNeWTA({ label: 'CCI', update_interval: 60, ta_name: 'CCI', params: { constant: 0.015, history: 14 }, params2: '' });
    this.addNeWTA({ label: 'CROSS_SMMA', update_interval: 60, ta_name: 'CROSS_SMMA', params: { short: 8, long: 13 }, params2: '' });
    this.addNeWTA({ label: 'MOME', update_interval: 60, ta_name: 'MOME', params: 100, params2: '' });
    this.addNeWTA({ label: 'DONCHIAN', update_interval: 60, ta_name: 'DONCHIAN', params: 20, params2: '' });
  }

  async update(candledata) {
    try {
      // Update buffers and incidators
      this.updateWithCandle(candledata);

      if (this.isStrategyReady()) {
        // Stop loss sell
        if (this.advice == 'BUY' && this.STOP_LOSS == 'stoploss') {
          this.SELL();
        }

        // Buy
        if (this.step % 11 == 0) {
          this.BUY();
        }

        // Sell
        if (this.step % 21 == 0) {
          this.SELL();
        }
      }
    } catch (e) {
      logger.error('Strategy error ', e);
    }
  }
}

module.exports = Strategy;
