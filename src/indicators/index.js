class TAIndicators {
  /* 
    label = @string unique name to indentify in the strategy
    update_interval = @number Candlestick/Tickchart update interval 60,120,180,300
    ta_name = @string Name of the TA script or Talib or Tulipb
    params = @number/object Required parameters
    params2 = @Optional parametes like O,H,L,C,V values for price update 
  */

  constructor(config = { label: 'label', update_interval: 60, ta_name: 'ema', params: {}, params2: 'ohlcv/4' }) {
    Object.assign(this, config);

    const indicator_base = require(`./custom/${this.ta_name}`);

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
