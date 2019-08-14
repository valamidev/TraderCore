"use strict";
/*
    Williams fractal
    http://fxcodebase.com/wiki/index.php/Fractal_Indicator
*/

var Indicator = function(period = 2) {
  this.input = "candle";

  this.period = period;

  this.buffer = [];

  this.result = "none";
};

Indicator.prototype.update = function(candle) {
  this.result = "none";
  this.buffer.push(candle);

  if (this.buffer.length > this.period * 2 + 1) {
    this.buffer.shift();
  }

  if (this.buffer.length == this.period * 2 + 1) {
    let low = 0;
    let high = 0;

    for (let i = 0; i <= this.period * 2; i++) {
      if (this.buffer[i].low > this.buffer[this.period].low) {
        low++;
      }
      if (this.buffer[i].high < this.buffer[this.period].high) {
        high++;
      }
    }

    if (low == 2 * this.period) {
      this.result = "down";
    }

    if (high == 2 * this.period) {
      this.result = "up";
    }
  }

  return;
};

module.exports = Indicator;
