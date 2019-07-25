"use strict"

const _ = require("lodash")
const util = require("../utils")
const logger = require("../logger")
const { pool, candle_db } = require("../database")
const candle_convert = require("candlestick-convert")

class Tradepairs {
  constructor() {}

  async get_candlestick(exchange, symbol, interval, limit = 0) {
    try {
      /* TODO remove hardcoded value */
      let exchange_base_interval = 60

      let table_name = util.candlestick_name(exchange, symbol, exchange_base_interval)

      let rows = []

      // Converted Candles
      if (interval != exchange_base_interval && limit != 0) {
        limit *= interval / exchange_base_interval

        // Limit should be always higher than convert ratio * 1,5 + 1
        limit += parseInt((interval / exchange_base_interval) * 1.5) + 1
      }

      if (limit == 0) {
        ;[rows] = await candle_db.query("SELECT * FROM `" + table_name + "` ORDER BY `time` ASC;")
      } else {
        ;[rows] = await candle_db.query("SELECT * FROM `" + table_name + "` ORDER BY `time` DESC LIMIT " + limit + ";")
      }

      // Sort by time asc
      rows = _.sortBy(rows, ["time"])

      // Convert into new timeframe
      if (interval != exchange_base_interval) {
        rows = candle_convert.json(rows, exchange_base_interval, interval)
      }

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }

  async load_tradepairs() {
    try {
      let [rows] = await pool.query("SELECT * FROM `tradepairs`;")

      this.tradepairs = rows

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }
}

module.exports = new Tradepairs()
