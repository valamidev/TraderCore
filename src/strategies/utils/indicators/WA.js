"use strict";
/*
    The Alligator’s Jaw, the “Blue” line, is a 13-period Smoothed Moving Average, moved into the future by 8 bars;

    The Alligator’s Teeth, the “Red” line, is an 8-period Smoothed Moving Average, moved by 5 bars into the future;

    The Alligator’s Lips, the “Green” line, is a 5-period Smoothed Moving Average, moved by 3 bars into the future.


  // Standard usage:
    BUY:
    this.BUF.wa[this.step].lips > this.BUF.wa[this.step].jaw &&
    this.BUF.wa[this.step].lips > this.BUF.wa[this.step].teeth &&
    this.BUF.wa[this.step].teeth > this.BUF.wa[this.step].jaw

    SELL:
    this.BUF.wa[this.step].jaw > this.BUF.wa[this.step].lips &&
    this.BUF.wa[this.step].jaw > this.BUF.wa[this.step].teeth &&
    this.BUF.wa[this.step].teeth > this.BUF.wa[this.step].lips


*/
// required indicators
var SMMA = require("./SMMA.js");

var Indicator = function(
  settings = {
    jawLength: 13,
    teethLength: 8,
    lipsLength: 5,
    jawOffset: 8,
    teethOffset: 5,
    lipsOffset: 3
  }
) {
  this.input = "candle";

  this.signal_smma = new SMMA(5);

  this.jawLength = new SMMA(settings.jawLength); // Blue
  this.teethLength = new SMMA(settings.teethLength); // Teeth
  this.lipsLength = new SMMA(settings.lipsLength); // Lips

  this.jawOffset = new SMMA(settings.jawOffset);
  this.teethOffset = new SMMA(settings.teethOffset);
  this.lipsOffset = new SMMA(settings.lipsOffset);

  this.result = { jaw: 0, teeth: 0, lips: 0, signal: 0 };
};

Indicator.prototype.update = function(candle) {
  let price = (candle.high + candle.low) / 2;

  this.signal_smma.update(price);
  this.jawLength.update(price);
  this.teethLength.update(price);
  this.lipsLength.update(price);
  this.jawOffset.update(price);
  this.teethOffset.update(price);
  this.lipsOffset.update(price);

  this.signal = this.signal_smma.result;

  this.jaw = this.signal + (this.jawLength.result - this.jawOffset.result);
  this.teeth =
    this.signal + (this.teethLength.result - this.teethOffset.result);
  this.lips = this.signal + (this.lipsLength.result - this.lipsOffset.result);

  this.result = {
    jaw: this.jaw,
    teeth: this.teeth,
    lips: this.lips,
    signal: this.signal
  };
};

module.exports = Indicator;
