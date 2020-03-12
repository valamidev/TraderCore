const logger = require('../../logger');
const { AbstractStrategy } = require('../abstract_strategy');

class Strategy extends AbstractStrategy {
  constructor(config = {}) {
    super();

    const bb_period = config.bb_period || 21;
    const bb_up = config.bb_up || 2.15;
    const bb_down = config.bb_down || 2.15;

    // General Strategy config
    this.predict_on = 0;
    this.learn = 1;
    // General Strategy config

    // TA Indicators
    this.addNeWTA({
      label: 'BB',
      updateInterval: 1200,
      nameTA: 'BB',
      params: {
        TimePeriod: bb_period,
        NbDevUp: bb_up,
        NbDevDn: bb_down,
      },
      params2: 'ohlcv/4',
    });
  }

  async update(candledata) {
    try {
      // Update buffers and indicators
      this.updateWithCandle(candledata);

      if (this.isStrategyReady()) {
        let candle = candledata[60];

        if (candle.low < this.TA_BUFFER.BB[this.step].lower) {
          this.BUY(candle.close);
        }

        // Sell
        if (candle.high > this.TA_BUFFER.BB[this.step].upper) {
          this.SELL(candle.close);
        }
      }
    } catch (e) {
      logger.error('Strategy error ', e);
    }
  }
}

module.exports = Strategy;
