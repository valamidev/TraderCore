"use strict";

const _ = require("lodash");
const util = require("../utils");
const logger = require("../logger");
const pool = require("../database");

class Tradepairs {
  constructor() {}

  async get_candlestick(exchange, symbol, interval, limit = 0) {
    try {
      let table_name = util.candlestick_name(exchange, symbol, interval);

      let rows = [];

      if (limit == 0) {
        [rows] = await pool.query(
          "SELECT * FROM `" + table_name + "` ORDER BY `time` ASC;"
        );
      } else {
        [rows] = await pool.query(
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

  async load_tradepairs_by_symbolANDinterval(names, interval = 300) {
    try {
      names = names.join();

      let [rows] = await pool.query(
        "SELECT * FROM `tradepairs` where symbol IN (" +
          names +
          ") and interval_sec = " +
          interval +
          ";"
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async load_tradepairs_by_interval(interval) {
    try {
      let [rows] = await pool.query(
        "SELECT * FROM `tradepairs` where interval_sec = ?;",
        [interval]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async add_tradepair(exchange, symbol, interval) {
    try {
      // Check existing before insert!
      if (!(await this.select_tradepair_single(exchange, symbol, interval))) {
        await pool.query(
          "INSERT INTO `tradepairs` (`exchange`, `symbol`, `interval_sec`) VALUES (?,?,?);",
          [exchange, symbol, interval]
        );
      }
      return;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async select_tradepair_single(exchange, symbol, interval) {
    try {
      let row = await pool.query(
        "SELECT * FROM `tradepairs` where `exchange` = ? and `symbol` = ? and `interval_sec` = ? LIMIT 1;",
        [exchange, symbol, interval]
      );

      return row[0][0];
    } catch (e) {
      logger.error("SQL error", e);
    }
  }
}

module.exports = new Tradepairs();
