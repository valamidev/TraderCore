"use strict";
const SMA = require("./SMA");
/*
    Average True Range (ATR)
    https://pipbear.com/indicator/average-true-range/
*/

const Indicator = function(period = 14) {
  this.input = "candle";

  this.sma = new SMA(period);

  this.buffer = [];

  this.result = 0;
};

Indicator.prototype.update = function(candle) {
  this.buffer.push(candle);

  // Keep buffer as long as we need
  if (this.buffer.length > 2) {
    this.buffer.shift();

    let c1 = this.buffer[0];
    let c2 = this.buffer[1];

    // True Range = Max(High[1]-Low[1]; High[1] — Close[2]; Close[2]-Low[1])
    let true_range = Math.max(
      c1.high - c1.low,
      c1.high - c2.close,
      c2.close - c1.low
    );

    this.sma.update(true_range);

    this.result = this.sma.result;
  } else {
    this.result = 0;
  }

  return;
};

module.exports = Indicator;
