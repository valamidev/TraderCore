"use strict"

const trade_util = require("./trade_utils")
const util = require("../utils")
const logger = require("../logger")

const ccxt_controller = require("../exchange/ccxt_controller")

// const fee = 1.001

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

      if (quantity > 0 || this.asset_balance - quantity < 0) {
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

      if (quantity > 0 || this.quote_balance - quote_limit < 0) {
        let response = await this.exchangeAPI.create_limit_buy_order(this.symbol, quantity, price)

        if (response) {
          await trade_util.insert_account_orders(response, this.instanceID)

          /*
          this.asset_balance 
          this.quote_balance 
          this.order_asset_balance 
          this.order_quote_balance
          */

          this.quote_balance -= response.amount * response.price
          this.order_quote_balance += response.amount * response.price

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
      let order = await trade_util.get_last_trades_by_instance(this.instanceID)

      if (order.length != 0) {
        order.map(async (order) => {
          let order_info = await this.exchangeAPI.fetchOrder(order.id, order.symbol)

          logger.verbose(order_info)

          /*
          info: {}
          type: 'limit',
          side: 'sell',
          price: 0.0003186,
          amount: 3.13,
          cost: 0.00099721,
          average: 0.00031859744408945683,
          filled: 3.13,
          remaining: 1,
          status: 'open', / 'closed', / 'canceled'
        */

          if (order_info.status == "open") {
            logger.verbose(`Open order ${order_info.id} , ${order_info.amount}/${order_info.filled} , ${order_info.price}`)
          }

          if (order_info.status == "closed") {
            logger.verbose(`Order filled ${order_info.id} , ${order_info.filled} , ${order_info.price}`)

            await this.book_order(order_info)
          }

          if (order_info.status == "canceled") {
            await this.book_order(order_info)
          }
        })
      }
    } catch (e) {
      logger.error("Trade instance order check error ", e)
    }
  }

  async book_order(order_info) {
    /*
      this.asset_balance 
      this.quote_balance 
      this.order_asset_balance 
      this.order_quote_balance
      */

    if (order_info.side == "sell") {
      // Add non sold assets to the balance
      this.asset_balance += order_info.remaining
      // Remove order assets from the order asset balance
      this.order_asset_balance -= order_info.amount
      // Add quotes gain after sold assets into the quote balance
      this.quote_balance += order_info.cost
    }

    if (order_info.side == "buy") {
      // Add non spent quotes back to balance
      this.quote_balance += order_info.remaining * order_info.price
      // Remove quotes from the order quote balance
      this.order_quote_balance -= order_info.amount * order_info.price
      // Add assets bought from order
      this.asset_balance += order_info.filled
    }

    // Avoid negative Order balance
    if (this.order_asset_balance < 0) this.order_asset_balance = 0
    if (this.order_quote_balance < 0) this.order_quote_balance = 0

    await this.sync_balance()
    await trade_util.close_acccount_trades(order_info.id)
  }
  // End of class
}

module.exports = TradeInstance
