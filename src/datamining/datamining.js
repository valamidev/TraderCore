"use strict";

const logger = require("../logger");
const util = require("../utils");
const pool = require("../database");
const pumpsignalAPI = require("../pumpsignal/pumpsignal");
const Discord = require("discord.js");
const _ = require("lodash");

const TradepairsAPI = require("../tradepairs/tradepairs");

const SMMA = require("../utils/indicators/SMMA");
const PPO = require("../utils/indicators/PPO");
const RSI = require("../utils/indicators/RSI");
const UO = require("../utils/indicators/UO");
const f = parseFloat;

class Datamining {
  constructor() {}

  sma_evenlop_test(candlechart) {
    let smaa_20 = new SMMA(20);
    let smaa_5 = new SMMA(5);
    let last_action = "";
    let pre_history_limit = 20;

    for (let i = 0; i < candlechart.length - 2; i++) {
      let midle_price = VolumeWeightedPrice(
        candlechart[i].assetVolume,
        candlechart[i].volume
      );

      //smaa_envelope
      let smmaFast5 = smaa_5.result;
      let smmaFast20 = smaa_20.result;

      if (i > pre_history_limit) {
        if (
          candlechart[i].high > smaa_envelope(smmaFast5, 0.5) &&
          candlechart[i].high < smaa_envelope(smmaFast20, 1.5) &&
          last_action != "SELL"
        ) {
          console.log("SELL", candlechart[i].high);
          last_action = "SELL";
        }

        if (
          candlechart[i].high < smaa_envelope(smmaFast5, -0.3) &&
          candlechart[i].high < smaa_envelope(smmaFast20, -1.2) &&
          last_action != "BUY"
        ) {
          console.log("BUY", candlechart[i].low);
          last_action = "BUY";
        }

        smaa_5.update(midle_price);
        smaa_20.update(midle_price);
      }
    }
  }

  async get_pumps_tensors() {
    try {
      let tradepairs = await TradepairsAPI.load_tradepairs_by_symbolANDinterval(
        [
          "'DLTBTC'",
          "'CVCBTC'",
          "'IOSTBTC'",
          "'BATBTC'",
          "'EVXBTC'",
          "'FUELBTC'",
          "'NULSBTC'",
          "'ICXBTC'",
          "'SYSBTC'"
        ],
        300
      );

      let tensor = {
        input: [],
        output: []
      };

      //tradepairs.length
      for (let i = 0; i < tradepairs.length; i++) {
        let candledata = await TradepairsAPI.get_candlestick(
          tradepairs[i].exchange,
          tradepairs[i].symbol,
          300
        );

        let result = this.create_pump_tensors_collection(candledata, 12, 0.98);

        tensor.input = _.concat(tensor.input, result.input);
        tensor.output = _.concat(tensor.output, result.output);
      }

      return tensor;
    } catch (e) {
      logger.error(e);
    }
  }

  create_pump_tensors_collection(data, frame, pump_limit = 1) {
    let tensor = {
      input: [],
      output: []
    };
    /* 
    
    timeframe: ticks before pump moment
    profit: minimum profit at peak of the pump session

    */

    for (let i = frame; i < data.length - frame; i++) {
      // Calculate pump tick
      let pump_size = data[i + 1].close / data[i].close;
      // Catch pump tick
      if (pump_size >= pump_limit) {
        // Slice Data for small handleable size (optimalization)
        let tensor_array = _.slice(data, i - frame, i);

        // Create the Chaikin Money Flow volume
        let sum_volume = _.sum(tensor_array.map(value => value.volume));

        // Create normalized tensor
        tensor.input.push(
          this.create_pump_tensor_single(tensor_array, sum_volume)
        );

        // tensor.output.push(pump_size);
        tensor.output.push(pump_size - 1);
      }
    } // Big Loop end

    return tensor;
  }

  create_pump_tensor_single(data, sum_volume) {
    let raw_input = {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: []
    };

    let result = [];

    for (let i = 0; i < data.length; i++) {
      //raw_input.open.push(data[i].open);
      raw_input.high.push(data[i].high);
      raw_input.low.push(data[i].low);
      raw_input.close.push(data[i].close);
      raw_input.volume.push(data[i].volume / sum_volume);
    }

    // result = _.concat(result, util.minMaxScaler(raw_input.open));
    result = _.concat(result, util.minMaxScaler(raw_input.high));
    result = _.concat(result, util.minMaxScaler(raw_input.low));
    result = _.concat(result, util.minMaxScaler(raw_input.close));
    result = _.concat(result, util.minMaxScaler(raw_input.volume));

    return result;
  }

  pump_indicator(data, symbol, profit = 0.995) {
    let count = [];
    let small_count = 0;

    for (let k = 2; k < 21; k++) {
      small_count = 0;
      for (let i = 0; i < data.length - 50; i++) {
        if (data[i].close / data[i + 1].close < profit) {
          if (data[i + 1].close / data[i + k].close < profit) {
            small_count++;
          }
        }
      }
      count.push(small_count);
    }
    console.log(symbol, " - ", count);
  }

  async get_pumps_single(exchange, symbol) {
    try {
      // let tradepairs = await TradepairsAPI.load_tradepairs();

      util.file_create("price_5times_after_pump_2percent");

      let candledata = await TradepairsAPI.get_candlestick(
        exchange,
        symbol,
        300
      );

      this.find_pump(
        _.slice(candledata, candledata.length - 2304, candledata.length),
        symbol
      );
    } catch (e) {
      logger.error(e);
    }
  }

  test_find_pump(data, symbol) {
    let sum_change_pos = 0;
    let sum_change_neg = 0;
    let sum_volume_pos = 0;
    let sum_volume_neg = 0;
    let change_pos_count = 0;
    let change_neg_count = 0;

    let tick_limit = 287;

    let delay = 2;

    for (let i = 0; i < data.length / tick_limit - 2; i++) {
      sum_change_pos = 0;
      sum_change_neg = 0;
      sum_volume_pos = 0;
      sum_volume_neg = 0;
      change_pos_count = 0;
      change_neg_count = 0;

      for (let j = i * tick_limit; j < (i + 1) * tick_limit; j++) {
        if (
          data[j].close / data[j + 1].close < 0.99 &&
          data[j + 1].assetVolume < 30
        ) {
          sum_volume_pos += data[j + 1].assetVolume;
          if (data[j + delay].close / data[j + 1].close - 1 > 0) {
            sum_change_pos += data[j + delay].close / data[j + 1].close - 1;
            change_pos_count++;
          } else {
            sum_change_neg += data[j + delay].close / data[j + 1].close - 1;
            change_neg_count++;
          }
        }
      }

      if (change_pos_count > 0 || change_neg_count > 0) {
        console.log(
          "Day:",
          new Date(data[i * tick_limit].time),
          "Avg volume: ",
          sum_volume_pos / change_pos_count
        );
        console.log(
          "AVG change pos ",
          symbol,
          util.round((sum_change_pos / change_pos_count) * 100),
          "Times: ",
          change_pos_count
        );
        console.log(
          "AVG change neg ",
          symbol,
          util.round((sum_change_neg / change_neg_count) * 100),
          "Times: ",
          change_neg_count
        );
      }
    }
  }
}

// HELPER FUNCTIONS

const NormalizeFactor = candlechart => {
  let max_high = _.maxBy(candlechart, "high").high;
  let scale = 1;

  if (max_high > 1) {
    scale = Math.pow(10, Math.trunc(max_high).toString().length + 1);
  } else {
    scale = (max_high / 1) * 10;
  }
  return scale;
};

const VolumeWeightedPrice = (assetVolume, volume) => {
  let result = 0;

  if (volume > 0) result = f(assetVolume) / f(volume);

  return f(result);
};

// Envelope
const smaa_envelope = (smaa, pct) => {
  return smaa * (1 + pct / 100);
};

module.exports = new Datamining();
