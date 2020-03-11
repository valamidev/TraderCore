/*
    Azzx_donchian
    https://pipbear.com/price-action-pattern/turtle-strategy/
*/

const Indicator = function(period) {
  this.input = 'candle';

  this.period = period;

  this.buffer = [];

  this.result = {
    min: 0,
    middle: 0,
    max: 0,
  };
};

Indicator.prototype.update = function(candle) {
  this.buffer.push(candle);

  this.result.min = candle.low;
  this.result.max = candle.high;

  // Keep buffer as long as we need
  if (this.buffer.length > this.period) {
    this.buffer.shift();
  }

  for (let i = 0; i < this.buffer.length; i++) {
    const elem = this.buffer[i];

    if (elem.low < this.result.min) {
      this.result.min = elem.low;
    }
    if (elem.high > this.result.max) {
      this.result.max = elem.high;
    }
  }

  this.result.middle = (this.result.min + this.result.max) / 2;

  return;
};

module.exports = Indicator;
