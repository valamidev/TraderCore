// stop loss as an indicator
// originally created by scraqz. Thanks!

const Indicator = function(threshold) {
  this.input = 'candle';
  this.candle = null;
  this.price = 0;
  this.result = 'continue'; // continue
  this.threshold = threshold;
};

Indicator.prototype.update = function(candle) {
  this.candle = candle;
  const stoploss = this.price * this.threshold;
  if (candle.close < stoploss) {
    // new trend
    this.result = 'stoploss'; // sell
  } else {
    if (this.price < candle.close) this.updatePrice(); // trailing
    this.result = 'continue'; // safe to continue with rest of strategy
  }
};
Indicator.prototype.updatePrice = function() {
  this.price = this.candle.close;
};
Indicator.prototype.long = function(price) {
  this.price = price;
  this.result = 'continue'; // reset in case we are in freefall before a buy
};

module.exports = Indicator;
