/* eslint-disable no-extra-semi */
"use strict"

const _ = require("lodash")
const util = require("../utils")
const logger = require("../logger")
const { pool, candle_db } = require("../database")
const candle_convert = require("candlestick-convert")

const exchange_base_interval = 60

class Tradepairs {
  constructor() {}

  async get_batched_candlestick(config) {
    try {
      const exchange = config.exchange || "binance"
      const symbol = config.symbol || "BTC/USDT"
      const intervals_time = config.intervals_time || [exchange_base_interval]
      //const intervals_tick = config.intervals_tick || [] /* TODO Implement */
      const limit = config.limit || 0
      let batch = {}
      let result = new Map()

      let limit_candlestick = limit + parseInt((_.max(intervals_time) / exchange_base_interval) * 1.5) + 1
      let candledata = await this.get_candlestick(exchange, symbol, exchange_base_interval, limit_candlestick)

      batch[exchange_base_interval] = candledata

      batch[exchange_base_interval].map((elem) => {
        result[elem.time] = {}
        result[elem.time][exchange_base_interval] = elem
      })

      if (intervals_time.length != 0) {
        for (let i = 0; i < intervals_time.length; i++) {
          const interval = intervals_time[i]

          let batched_candles = candle_convert.json(candledata, exchange_base_interval, interval)

          batch[interval] = batched_candles

          batch[interval].map((elem) => {
            result[elem.time][interval] = elem
          })
        }
      }

      return result
    } catch (e) {
      logger.error("Batched Candlestick error", e)
    }
  }

  async get_candlestick(exchange, symbol, interval, limit = 0) {
    try {
      let rows = []

      // TODO add proper support Tick Chart values
      if ([16, 32, 64, 128, 256, 512, 1024].indexOf(interval) >= 0) {
        rows = await this.get_tickchart(exchange, symbol, interval, limit)

        return rows
      }

      let table_name = util.candlestick_name(exchange, symbol, exchange_base_interval)

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

  async get_tickchart(exchange, symbol, tick_lenght, limit = 0, time = 0) {
    try {
      let table_name = util.trades_name(exchange, symbol)

      let rows = []

      if (limit == 0) {
        ;[rows] = await candle_db.query("SELECT * FROM `" + table_name + "` WHERE time > ? ORDER BY `time` ASC;", [time])
      } else {
        ;[rows] = await candle_db.query("SELECT * FROM `" + table_name + "` WHERE time > ? ORDER BY `time` DESC LIMIT " + limit + ";", [time])
      }

      rows = candle_convert.tick_chart(rows, tick_lenght)

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
