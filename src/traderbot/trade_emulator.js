"use strict"

const util = require("../utils")
const logger = require("../logger")

class TradeEmulator {
  constructor(config = {}) {
    //   Config parse
    this.asset_balance = config.asset_balance || 0
    this.quote_balance = config.quote_balance || 1000
    this.fee = config.fee || 0.001
    this.stop_loss_limit = config.stop_loss_limit || 0.9
    this.trailing_limit = config.trailing_limit || 0.01
    this.portion_pct = config.portion || 10

    this.order_size = this.quote_balance / this.portion_pct
    this.orders = []
    this.order_history = []

    this.price = -1
  }

  async action(advice) {
    try {
      /*
        Advice: {
          action:
          price:
        }
        */

      if (advice.action == "BUY") {
        await this.buy(advice.price)
      } else if (advice.action == "SELL") {
        await this.sell(advice.price)
      }

      return
    } catch (e) {
      logger.error("Trade instance error ", e)
    }
  }

  async sell(price) {
    try {
      //  logger.info(`Trade emulator Sell ${price}`)
    } catch (e) {
      logger.error("Trade instance error sell ", e)
    }
  }

  async buy(price) {
    try {
      if (this.quote_balance < this.order_size) {
        //Insuficient fund
        return
      }

      await this.create_order({
        type: "BUY",
        price,
        size: this.order_size,
        stop_loss_limit: this.stop_loss_limit,
        trailing_limit: this.trailing_limit
      })
    } catch (e) {
      logger.error("Trade instance error ", e)
    }
  }

  async create_order(config) {
    try {
      let quantity = config.size

      if (config.type == "BUY") {
        quantity = util.buy_quantity_by_symbol(config.size, config.price)
      }

      let stop_loss_price = config.price * config.stop_loss_limit
      let trailing_price = config.price + config.price * config.trailing_limit * 2
      let trailing_limit = config.trailing_limit

      let order = {
        price: config.price,
        quantity,
        stop_loss_price,
        trailing_price,
        trailing_limit,
        closed: 0
      }

      this.orders.push(order)

      if (config.type == "BUY") {
        this.quote_balance -= config.size
        this.asset_balance += quantity
      }

      return
    } catch (e) {
      logger.error("Trade emulator create_order error ", e)
    }
  }

  async update(price) {
    try {
      this.price = price

      this.orders = this.orders.map((order) => {
        if (order.stop_loss_price >= price && order.closed == 0) {
          this.quote_balance += (order.quantity * price) / (1 + this.fee * 2)
          this.asset_balance -= order.quantity

          this.order_history.push(order)

          order.sold = price
          order.closed = 1
        }

        if (price >= order.trailing_price && order.closed == 0) {
          order.stop_loss_price = price - price * order.trailing_limit
          order.trailing_price = price + price * order.trailing_limit
        }

        return order
      })
    } catch (e) {
      logger.error("Trade emulator create_order error ", e)
    }
  }

  full_balance() {
    return this.quote_balance + this.asset_balance * this.price
  }
}

module.exports = TradeEmulator
