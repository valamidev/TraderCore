"use strict"

const logger = require("../logger")
const _ = require("lodash")
// CCXT
const ccxt = require("ccxt")
const ccxt_config = require("../../ccxt_config.json")

class ExchangeAPI {
  constructor() {
    this.exchanges = []
  }

  /* CCXT API STUFF */

  load_exchange_api(exchange) {
    try {
      exchange = exchange.toLowerCase()

      // Check if CCXT API already loaded
      let exchange_data = this.exchanges.filter((e) => e.exchange == exchange)

      // CCTX API load from buffer or add to the buffer
      if (exchange_data.length == 0) {
        exchange_data = this.init_new_exchanges(exchange)
      } else {
        exchange_data = exchange_data[0]
      }

      return exchange_data.api
    } catch (e) {
      logger.error("CCXT load API error ", e)
    }
  }

  init_new_exchanges(exchange) {
    exchange = exchange.toLowerCase()

    // Load config
    let config = {}

    _.isObject(ccxt_config[exchange])
    {
      config = ccxt_config[exchange]
    }

    // Check exchange is valid
    if (_.isObject(ccxt[exchange])) {
      // Create new exchange with config
      let api = new ccxt[exchange](config)

      this.exchanges.push({ exchange, api })

      return { exchange, api }
    } else {
      throw `Invalid Exchange ${exchange}`
    }
  }

  /* CCXT API STUFF */
}

module.exports = new ExchangeAPI()
