class TAIndicators {
  /* 
    label = @string unique name to indentify in the strategy
    updateInterval = @number Candlestick/Tickchart update interval 60,120,180,300
    nameTA = @string Name of the TA script or Talib or Tulipb
    params = @number/object Required parameters
    params2 = @Optional parametes like O,H,L,C,V values for price update 
  */

  constructor(config = { label: 'label', updateInterval: 60, nameTA: 'ema', params: {}, params2: 'ohlcv/4' }) {
    Object.assign(this, config);

    const indicator_base = require(`./custom/${this.nameTA}`);

    this.indicator = new indicator_base(this.params);

    this.result = -1;
    this.lastUpdate = -1;
  }

  update(candle, step) {
    this.lastUpdate = step;

    // Price update
    if (this.indicator.input === 'price') {
      let price = candle.open;

      switch (this.params2) {
        case 'open':
          price = candle.open;
          break;
        case 'close':
          price = candle.close;
          break;
        case 'high':
          price = candle.high;
          break;
        case 'low':
          price = candle.low;
          break;
        default:
          // ohlcv/4
          price = (candle.open + candle.close + candle.high + candle.low) / 4;
          break;
      }

      this.indicator.update(price);
    } // Candle
    else {
      this.indicator.update(candle);
    }
    this.result = this.indicator.result;
    return this.result;
  }
}

module.exports = TAIndicators;
