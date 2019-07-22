"use strict";

const _ = require("lodash");
const util = require("../utils");
const logger = require("../logger");
const { pool, candle_db } = require("../database");

class Tradepairs {
  constructor() {}

  async get_candlestick(exchange, symbol, interval, limit = 0) {
    try {
      let table_name = util.candlestick_name(exchange, symbol, interval);

      let rows = [];

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
