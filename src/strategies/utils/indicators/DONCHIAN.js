"use strict";
/*
    Azzx_donchian
    https://pipbear.com/price-action-pattern/turtle-strategy/
*/

var Indicator = function(period) {
  this.input = "candle";

  this.period = period;

  this.buffer = [];

  this.result = {
    min: 0,
    middle: 0,
    max: 0
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

    this.result.min = this.lower(this.result.min, elem.low);
    this.result.max = this.higher(this.result.max, elem.high);
  }

  this.result.middle = (this.result.min + this.result.max) / 2;

  return;
};

Indicator.prototype.higher = function(value, new_value) {
  if (new_value > value) {
    return new_value;
  } else {
    return value;
  }
};

Indicator.prototype.lower = function(value, new_value) {
  if (new_value < value) {
    return new_value;
  } else {
    return value;
  }
};

module.exports = Indicator;
