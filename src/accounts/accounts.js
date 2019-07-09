"use strict";

const util = require("../utils");
const _ = require("lodash");
const logger = require("../logger");
const pool = require("../database");

class Accounts {
  constructor() {}

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
