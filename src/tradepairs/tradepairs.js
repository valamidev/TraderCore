"use strict";

const _ = require("lodash");
const util = require("../utils");
const logger = require("../logger");
const { pool, candle_db } = require("../database");
const candle_convert = require("candlestick-convert");

class Tradepairs {
  constructor() {}

  async get_candlestick(exchange, symbol, interval, limit = 0) {
    try {
      /* TODO remove hardcoded value */
      let table_name = util.candlestick_name(exchange, symbol, 60);

      let rows = [];

      // Converted Candles
      if (interval != 60 && limit != 0) {
        // Limit should be always higher than convert ratio * 1,5 + 1
        limit += parseInt((interval / 60) * 1.5) + 1;
      }

      if (limit == 0) {
        [rows] = await candle_db.query(
          "SELECT * FROM `" + table_name + "` ORDER BY `time` ASC;"
        );
      } else {
        [rows] = await candle_db.query(
          "SELECT * FROM `" +
            table_name +
            "` ORDER BY `time` DESC LIMIT " +
            limit +
            ";"
        );
      }

      // Sort by time asc
      rows = _.sortBy(rows, ["time"]);

      // Convert into new timeframe
      if (interval != 60) {
        rows = candle_convert.json(rows, 60, interval);
      }

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async load_tradepairs() {
    try {
      let [rows] = await pool.query("SELECT * FROM `tradepairs`;");

      this.tradepairs = rows;

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }
}

module.exports = new Tradepairs();
