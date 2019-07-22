"use strict";

const _ = require("lodash");
const logger = require("../logger");
const { pool } = require("../database");
const Binance = require("../exchange/Binance");

class Accounts {
  constructor() {
    this.loopdelay = 30000;
  }

  async start() {
    try {
      this.update_loop();

      logger.verbose("Account API started");
    } catch (e) {
      logger.error("Account start ", e);
    }
  }

  async update_loop() {
    try {
      await this.update_balances();
      await this.update_orders();

      logger.verbose("Account API update loop");
    } catch (e) {
      logger.error("Account update loop error ", e);
    } finally {
      setTimeout(async () => {
        this.update_loop();
      }, this.loopdelay);
    }
  }

  async update_orders() {
    try {
      let orders = await Binance.promise_get_open_orders();

      /* TODO SOMETHING BETTER FOR CLEANUP! */
      let queries = "DELETE FROM `account_orders`;";

      for (let i = 0; i < orders.length; i++) {
        queries += "REPLACE INTO `account_orders` SET  ?;";
      }

      await pool.query(queries, orders);
    } catch (e) {
      logger.error("Orders loop", e);
    }
  }

  async update_balances() {
    try {
      let balances = await Binance.promise_get_balance();

      let time = Date.now();
      // Create Array for MySQL query
      balances = Object.keys(balances).map(key => {
        return [key, balances[key].available, balances[key].onOrder, time];
      });

      await pool.query(
        "REPLACE INTO `account_balance` (`symbol`, `available`, `onOrder`, `time`) VALUES ?;",
        [balances]
      );
    } catch (e) {
      logger.error("Balance loop", e);
    }
  }

  async get_acc_data(name) {
    try {
      let result = {};

      result.data = await this.load_account_data(name);

      if (typeof result.data.guid !== "undefinied") {
        result.options_raw = await this.load_account_options(result.data.guid);

        result.options = {};

        // Convert Options data into object and care about types!
        result.options_raw.map(elem => {
          switch (elem.type) {
            case "number":
              result.options[elem.name] = Number(elem.value);
              break;
            case "array":
              result.options[elem.name] = _.split(elem.value, ",");
              break;

            default:
              result.options[elem.name] = elem.value;
              break;
          }
        });

        return result;
      }
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async load_account_data(name) {
    try {
      let [rows] = await pool.query(
        "SELECT * FROM `accounts` WHERE name = ? LIMIT 1;",
        [name]
      );

      return rows[0];
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async load_account_options(guid) {
    try {
      let [rows] = await pool.query(
        "SELECT * FROM `account_options` WHERE owner_guid = ?;",
        [guid]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async replace_options(guid, name, value) {
    try {
      await pool.query(
        "REPLACE INTO `account_options` (`owner_guid`, `name`, `value`) VALUES (?,?,?);",
        [guid, name, value]
      );
      return;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }
}

module.exports = new Accounts();
