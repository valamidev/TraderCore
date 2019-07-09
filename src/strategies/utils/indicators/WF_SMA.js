"use strict";
/*
    Williams fractal
    http://fxcodebase.com/wiki/index.php/Fractal_Indicator
*/

var Indicator = function(period = 2) {
  this.input = "ohcl4price";

  this.period = period;

  this.buffer = [];

  this.result = "none";
};

Indicator.prototype.update = function(price) {
  this.result = "none";
  this.buffer.push(price);

  if (this.buffer.length > this.period * 2 + 1) {
    this.buffer.shift();
  }

  if (this.buffer.length == this.period * 2 + 1) {
    let low = 0;
    let high = 0;

    for (let i = 0; i <= this.period * 2; i++) {
      if (this.buffer[i] > this.buffer[this.period]) {
        low++;
      }
      if (this.buffer[i] < this.buffer[this.period]) {
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
