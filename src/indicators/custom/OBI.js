"use strict";
// @link https://www.investopedia.com/terms/o/onbalancevolume.asp

const _ = require("lodash");

var Indicator = function(weight) {
  this.input = "price";
  this.weight = weight;
  this.result = false;
  this.volume_buffer = [];
  this.age = 0;
  this.last_close = 0;
};

Indicator.prototype.update = function(candle) {
  this.calculate(candle);
};

Indicator.prototype.calculate = function(candle) {
  this.volume_buffer.push(candle.volume);

  if (this.volume_buffer.length <= this.weight) {
    this.result = 0;
    return;
  } else {
    this.volume_buffer.shift();
  }

  if (candle.close > this.last_close) {
    this.result += candle.volume / _.sum(this.volume_buffer);
  }

  if (candle.close == this.last_close) {
    this.result = 0;
  }

  if (candle.close < this.last_close) {
    this.result -= candle.volume / _.sum(this.volume_buffer);
  }

  this.result *= 0.1;

  if (this.result > 1) this.result = 1;

  if (this.result < -1) this.result = -1;

  this.last_close = candle.close;
};

module.exports = Indicator;
