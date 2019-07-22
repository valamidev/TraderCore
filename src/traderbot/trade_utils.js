"use strict";
const logger = require("../logger");
const { pool } = require("../database");

const trade_util = {
  insert_account_trades: async (resp, instance_id) => {
    try {
      let time = Date.now();

      let [rows] = await pool.query(
        "INSERT INTO `account_trades` (`instance_id`, `symbol`, `orderId`, `clientOrderId`,  `price`, `origQty`, `executedQty`, `cummulativeQuoteQty`, `type`, `side`, `time`) VALUES (?,?,?,?,?,?,?,?,?,?,?);",
        [
          instance_id,
          resp.symbol,
          resp.orderId,
          resp.clientOrderId,
          resp.price,
          resp.origQty,
          resp.executedQty,
          resp.cummulativeQuoteQty,
          resp.type,
          resp.side,
          time
        ]
      );
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  close_acccount_trades: async orderId => {
    try {
      let [rows] = await pool.query(
        "UPDATE `account_trades` SET `closed` = 1 WHERE `orderId` = ?;",
        [orderId]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  get_last_trades_by_instance: async instance_id => {
    try {
      let [rows] = await pool.query(
        "SELECT * FROM `account_trades` WHERE `instance_id` = ? AND `type` LIKE 'LIMIT' AND `closed` = 0 ORDER BY `account_trades`.`time` DESC LIMIT 1;",
        [instance_id]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  set_trade_instance_balance: async (
    guid,
    asset_balance,
    quote_balance,
    order_asset_balance = 0,
    order_quote_balance = 0
  ) => {
    try {
      let [rows] = await pool.query(
        "UPDATE `account_trader_instances` SET `asset_balance` = ?, `quote_balance` = ? , `order_asset_balance` = ?, `order_quote_balance` = ? WHERE `guid` = ?;",
        [
          asset_balance,
          quote_balance,
          order_asset_balance,
          order_quote_balance,
          guid
        ]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  get_trade_advice: async (algo_name, time = 0) => {
    try {
      let [rows] = await pool.query(
        "SELECT DISTINCT `trade_advice`.`symbol`, `action`, `prevActionIfNotIdle`,  `time`, `asset`, `quote`, `close` FROM `trade_advice` JOIN tradepairs ON trade_advice.symbol = tradepairs.symbol WHERE algo = ? and time > ? ORDER BY `time` DESC LIMIT 500;",
        [algo_name, time]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  get_balance_single: async asset => {
    try {
      let [rows] = await pool.query(
        "SELECT * FROM `account_balance` WHERE `symbol` = ? limit 1;",
        [asset]
      );

      return rows[0];
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  get_prices: async () => {
    try {
      let [rows] = await pool.query("SELECT * FROM `livefeed_prices`;");

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  },

  get_tradeinfo: async () => {
    try {
      let [rows] = await pool.query("SELECT * FROM `livefeed_tradeinfo`;");

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }
};

module.exports = trade_util;
