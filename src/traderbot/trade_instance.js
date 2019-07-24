"use strict"

const trade_util = require("./trade_utils")
const util = require("../utils")
const logger = require("../logger")

const ccxt_controller = require("../exchange/ccxt_controller")

const fee = 1.001

class TradeInstance {
  constructor(config) {
    //   Config parse
    this.instanceID = config.instanceID
    this.symbol = config.symbol
    this.asset = config.asset
    this.quote = config.quote
    this.asset_balance = config.asset_balance
    this.quote_balance = config.quote_balance
    this.order_asset_balance = config.order_asset_balance
    this.order_quote_balance = config.order_quote_balance

    this.strategy_guid = config.strategy_guid
    this.limit_order = config.limit_order
    this.exchange = config.exchange
    //   Config parse

    // WARNING EVERY FIELD SYNCED FROM DATABASE DO NOT USE ANY NON DB LOADED VARIABLE!
    // Load Exchange API
    this.exchangeAPI = ccxt_controller.load_exchange_api(this.exchange)
  }

  async update(advice) {
    try {
      logger.info(`Trade instance update ${advice.action} , ${advice.close}`)

      // Check values
      if (typeof advice.action != "undefined" || typeof advice.close != "undefined") {
        // All in trades can have undefined or 0 quantities
        if (typeof advice.quantity == "undefined") {
          advice.quantity = 0
        }

        if (advice.action == "BUY") {
          await this.buy(advice.close, advice.quantity)
        } else if (advice.action == "SELL") {
          await this.sell(advice.close, advice.quantity)
        }
      }

      await this.check_order()

      return
    } catch (e) {
      logger.error("Trade instance error ", e)
    }
  }

  async sell(price, quantity = 0) {
    try {
      // If quanity is not set use Asset Balance
      if (quantity == 0) {
        quantity = this.asset_balance
      }

      logger.info(`SYMBOL: ${this.symbol} SELL QUANTITY: ${quantity}`)

      if (quantity > 0) {
        let response = await this.exchangeAPI.create_limit_sell_order(this.symbol, quantity, price)

        if (response) {
          await trade_util.insert_account_orders(response, this.instanceID)

          /*
          this.asset_balance 
          this.quote_balance 
          this.order_asset_balance 
          this.order_quote_balance
          */

          this.asset_balance -= response.amount
          this.order_asset_balance += response.amount

          await this.sync_balance()
        }
      }
    } catch (e) {
      logger.error("Trade instance error sell ", e)
    }
  }

  async buy(price, quote_limit = 0) {
    try {
      let quantity = 0

      if (quote_limit == 0 || quote_limit > this.quote_balance) {
        quote_limit = this.quote_balance
      }

      // Calculate quantity
      quantity = util.buy_quantity_by_symbol(quote_limit, price)
      // Round quantity

      logger.info(`SYMBOL: ${this.symbol} BUY QUANTITY: ${quantity}`)

      if (quantity > 0) {
        let response = await this.exchangeAPI.create_limit_buy_order(this.symbol, quantity, price)

        if (response) {
          await trade_util.insert_account_orders(response, this.instanceID)

          /*
          this.asset_balance 
          this.quote_balance 
          this.order_asset_balance 
          this.order_quote_balance
          */

          this.quote_balance -= response.amount
          this.order_quote_balance += response.amount

          await this.sync_balance()
        }
      }
    } catch (e) {
      logger.error("Trade instance error ", e)
    }
  }

  async sync_balance() {
    try {
      /*
      this.asset_balance 
      this.quote_balance 
      this.order_asset_balance 
      this.order_quote_balance
      */
      await trade_util.set_trade_instance_balance(this.instanceID, this.asset_balance, this.quote_balance, this.order_asset_balance, this.order_quote_balance)
    } catch (e) {
      logger.error("Trade instance sync balance error ", e)
    }
  }

  async check_order() {
    try {
      let time = Date.now()

      let order = await trade_util.get_last_trades_by_instance(this.instanceID)

      if (order.length != 0) {
        console.log(order[0].id, order[0].symbol)

        let order_info = await this.exchangeAPI.fetchOrder(order[0].id, order[0].symbol)

        console.log(order_info)

        /*
        console.log("Order balances", this.order_asset_balance, this.order_quote_balance)

        // Order completed!
        if (order_info.status == "FILLED") {
          logger.verbose(`Order filled ${order_info.orderId} , ${order_info.executedQty} , ${order_info.cummulativeQuoteQty}`)

          await trade_util.close_acccount_trades(order_info.orderId)

          await this.sync_balance(order_info.side, order_info.executedQty, order_info.cummulativeQuoteQty)
        }

        if (order_info.status == "NEW") {
        }

        if (order_info.status == "PARTIALLY_FILLED") {
        }

        if (order_info.status == "CANCELED") {
          await trade_util.close_acccount_trades(order_info.orderId)

          await trade_util.set_trade_instance_balance(this.instanceID, this.order_asset_balance, this.order_quote_balance, 0, 0)
        */
      }
    } catch (e) {
      logger.error("Trade instance order check error ", e)
    }
  }

  // End of class
}

module.exports = TradeInstance
