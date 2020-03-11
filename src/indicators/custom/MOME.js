// required indicators
// Momentum Oscillator = (Price today / Price n periods ago) x 100

var Indicator = function(windowLength) {
  this.input = 'price';
  this.windowLength = windowLength;
  this.prices = [];
  this.result = 0;
};

Indicator.prototype.update = function(price) {
  this.prices.push(price);

  if (this.prices.length >= this.windowLength) {
    this.result = price / this.prices[0] - 1;
    this.prices.shift();
  }

  if (this.result > 1) this.result = 1;
};

module.exports = Indicator;
