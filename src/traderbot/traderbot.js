"use strict"

const _ = require("lodash")
const trade_util = require("./trade_utils")
const util = require("../utils")
const logger = require("../logger")
const { pool } = require("../database")

const TradeInstance = require("./trade_instance")

class Traderbot {
  constructor() {
    this.tradeinfo = []
    this.trade_instances = []

    this.strategy_advices = []

    this.update_loop_timeout = 10000
  }

  async start() {
    try {
      // Update trade advice timer
      this.last_advice_time = await this.get_db_last_advice_time()

      // Load/Reload instances
      await this.load_instances()

      // Start update loop
      await this.update_loop_trader_instances()
    } catch (e) {
      logger.error("Tradebot start error!", e)
    }
  }

  async update_loop_trader_instances() {
    try {
      await this.update_trade_instances()
      await this.load_instances()
    } catch (e) {
      logger.error("Traderbot update loop error!", e)
    } finally {
      setTimeout(() => {
        this.update_loop_trader_instances()
      }, this.update_loop_timeout)
    }
  }

  async load_instances() {
    try {
      let instances = await this.load_trade_instances_db()

      let new_instances = []

      instances.map((elem) => {
        let new_instance = new TradeInstance({
          exchange: "binance",
          limit_order: elem.limit_order,
          instanceID: elem.guid,
          strategy_guid: elem.strategy_guid,
          symbol: elem.symbol,
          asset: elem.asset,
          quote: elem.quote,
          asset_balance: elem.asset_balance,
          quote_balance: elem.quote_balance,
          order_asset_balance: elem.order_asset_balance,
          order_quote_balance: elem.order_quote_balance
        })

        new_instances.push(new_instance)
      })

      this.trade_instances = new_instances

      logger.verbose(`Tradebot instances loaded, count: ${this.trade_instances.length}`)
    } catch (e) {
      logger.error("Tradebot error!", e)
    }
  }

  async api_update_trade_instance(instanceID, advice = { action: "IDLE", price: 1000000 }) {
    try {
      for (let i = 0; i < this.trade_instances.length; i++) {
        let trader = this.trade_instances[i]

        // Update Trader instances
        if (trader.instanceID == instanceID) {
          trader.update(advice)
        }
      }
    } catch (e) {
      logger.error("Traderbot API update Error", e)
    }
  }

  async update_trade_instances() {
    try {
      // Get fresh Advices from DB
      this.strategy_advices = await this.get_trade_advice_db(this.last_advice_time)

      logger.verbose(`Trade advice length: ${this.strategy_advices.length} Last advice time: ${this.last_advice_time}`)

      // New advices
      if (this.strategy_advices.length != 0) {
        // Update Trade instances
        for (let i = 0; i < this.trade_instances.length; i++) {
          let trader = this.trade_instances[i]

          let strategy_advice = this.strategy_advices.filter((elem) => elem.strategy_guid == trader.strategy_guid)

          // Update Trader instances
          if (strategy_advice.length != 0) {
            trader.update(strategy_advice[0])
          }
        }
      } else {
        this.trade_instances.map((trader) => {
          trader.update({ action: "PING" })
        })
      }

      logger.verbose(`Tradebot instances updated, count: ${this.trade_instances.length}`)

      // Update advice time to avoid double actions
      this.last_advice_time = await this.get_db_last_advice_time()
    } catch (e) {
      logger.error("Traderbot Trade Error", e)
    }
  }

  async load_trade_instances_db() {
    try {
      let [rows] = await pool.query("SELECT * FROM `account_trader_instances`;")

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }

  async get_trade_advice_db(time = 0) {
    try {
      let [rows] = await pool.query(
        "SELECT DISTINCT `trade_advice`.`symbol`, `trade_advice`.`exchange`, `trade_advice`.`strategy_guid`, `trade_advice`.`strategy`, `trade_advice`.`strategy_config`, `action`,  trade_advice.`time`, `asset`, `quote`, `close` FROM `trade_advice` JOIN tradepairs ON trade_advice.symbol = tradepairs.symbol WHERE trade_advice.time > ? ORDER BY trade_advice.`time` DESC;",
        [time]
      )

      return rows
    } catch (e) {
      logger.error("SQL error", e)
    }
  }

  async get_db_last_advice_time() {
    try {
      let [rows] = await pool.query("SELECT time FROM `trade_advice` ORDER BY `trade_advice`.`time` DESC LIMIT 1;")

      if (rows.length == 0) {
        return Date.now()
      } else {
        return rows[0].time
      }
    } catch (e) {
      logger.error("SQL error", e)
    }
  }
}

module.exports = new Traderbot()
