"use strict";
// required indicators
// TRIX(i) = (EMA3(i) - EMA3(i - 1))/ EMA3(i-1)
// The final formula can be simplified to: 100 * (ema3 / ema3(-1) - 1)

var EMA = require("./EMA.js");

var Indicator = function(weight) {
  this.input = "price";
  this.result = 0;
  this.ema1 = new EMA(weight);
  this.ema2 = new EMA(weight);
  this.ema3 = new EMA(weight);
  this.BUF = [];
};

Indicator.prototype.update = function(price) {
  this.ema1.update(price);
  this.ema2.update(this.ema1.result);
  this.ema3.update(this.ema2.result);

  this.BUF.push(this.ema3.result);

  if (this.BUF.length > 2) {
    this.BUF.shift();
  }

  if (this.BUF.length == 2) {
    this.result = 100 * (this.BUF[1] / this.BUF[0] - 1);
  }

  if (this.result > 1) {
    this.result = 1;
  }
};

module.exports = Indicator;
