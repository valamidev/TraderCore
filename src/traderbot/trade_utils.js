"use strict"
const logger = require("../logger")
const { pool } = require("../database")

const trade_util = {
  insert_account_orders: async (resp, instance_id) => {
    try {
      let time = Date.now()

      /*
              info: {},
              id: '31865059',
              timestamp: 1563975044422,
              datetime: '2019-07-24T13:30:44.422Z',
              lastTradeTimestamp: undefined,
              symbol: 'HC/BTC',
              type: 'limit',
              side: 'sell',
              price: 0.000308,
              amount: 1,
              cost: 0,
              average: undefined,
              filled: 0,
              remaining: 1,
              status: 'open',
              fee: undefined,
              trades: undefined
      */
      let closed = 0

      let data = [
        resp.id,
        instance_id,
        time,
        resp.timestamp,
        resp.datetime,
        resp.lastTradeTimestamp,
        resp.symbol,
        resp.type,
        resp.side,
        resp.price,
        resp.amount,
        resp.cost,
        resp.average,
        resp.filled,
        resp.remaining,
        resp.status,
        resp.fee,
        resp.trades,
        JSON.stringify(resp.info),
        closed
      ]

      let [rows] = await pool.query(
        "INSERT INTO `account_orders` (`id`, `instance_id`, `time`, `timestamp`, `datetime`, `lastTradeTimestamp`, `symbol`, `type`, `side`, `price`, `amount`, `cost`, `average`, `filled`, `remaining`, `status`, `fee`, `trades`, `info`,`closed`) VALUES ?;",
        [[data]]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  close_acccount_trades: async (orderId) => {
    try {
      let [rows] = await pool.query("UPDATE `account_orders` SET `closed` = 1 WHERE `id` = ?;", [orderId])

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  get_last_trades_by_instance: async (instance_id) => {
    try {
      let [rows] = await pool.query(
        "SELECT * FROM `account_orders` WHERE `instance_id` = ? AND `type` LIKE 'LIMIT' AND `closed` = 0 ORDER BY `account_orders`.`time` DESC LIMIT 1;",
        [instance_id]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  set_trade_instance_balance: async (instance_id, asset_balance, quote_balance, order_asset_balance, order_quote_balance) => {
    try {
      let [rows] = await pool.query(
        "UPDATE `account_trader_instances` SET `asset_balance` = ?, `quote_balance` = ? , `order_asset_balance` = ?, `order_quote_balance` = ? WHERE `guid` = ?;",
        [asset_balance, quote_balance, order_asset_balance, order_quote_balance, instance_id]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  get_trade_advice: async (algo_name, time = 0) => {
    try {
      let [rows] = await pool.query(
        "SELECT DISTINCT `trade_advice`.`symbol`, `action`, `prevActionIfNotIdle`,  `time`, `asset`, `quote`, `close` FROM `trade_advice` JOIN tradepairs ON trade_advice.symbol = tradepairs.symbol WHERE algo = ? and time > ? ORDER BY `time` DESC LIMIT 500;",
        [algo_name, time]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  get_balance_single: async (asset) => {
    try {
      let [rows] = await pool.query("SELECT * FROM `account_balance` WHERE `symbol` = ? limit 1;", [asset])

      return rows[0]
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  get_prices: async () => {
    try {
      let [rows] = await pool.query("SELECT * FROM `livefeed_prices`;")

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  },

  get_tradeinfo: async () => {
    try {
      let [rows] = await pool.query("SELECT * FROM `livefeed_tradeinfo`;")

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }
}

module.exports = trade_util
