// OPEN + HIGH + LOW + CLOSE / 4

var Indicator = function() {
  this.input = 'candle';
  this.result = 0;
};

// the result
Indicator.prototype.update = function(candle) {
  this.result = (candle.open + candle.high + candle.low + candle.close) / 4;
};

module.exports = Indicator;
