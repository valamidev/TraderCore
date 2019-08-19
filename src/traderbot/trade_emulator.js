"use strict"

const util = require("../utils")
const logger = require("../logger")

class TradeEmulator {
  constructor(config = {}) {
    this.asset_balance = config.asset_balance || 0
    this.quote_balance = config.quote_balance || 1000
    this.fee = config.fee || 0.001
    this.stop_loss_limit = config.stop_loss_limit || 0.9 // -1 disable
    this.trailing_limit = config.trailing_limit || 0.01 // -1 disable
    this.portion_pct = config.portion_pct || 10

    this.order_size = (this.quote_balance / 100) * this.portion_pct

    this.orders = []
    this.order_history = []

    this.price = -1
  }

  async action(advice) {
    try {
      /*{
          action:
          price:
          time:
        }*/

      if (advice.action == "BUY") {
        await this.buy(advice.price, advice.time)
      } else if (advice.action == "SELL") {
        await this.sell(advice.price, advice.time)
      }

      return
    } catch (e) {
      logger.error("Trade emulator error ", e)
    }
  }

  async sell(price, time) {
    try {
      this.orders = this.orders.map((order) => {
        if (order.closed == 0) {
          this.quote_balance += (order.quantity * price) / (1 + this.fee * 2)
          this.asset_balance -= order.quantity

          this.order_history.push(order)

          order.sold = price
          order.closed = time
          order.close_type = "Sell"
          order.balance = this.full_balance()
        }

        return order
      })
    } catch (e) {
      logger.error("Trade emulator Sell error ", e)
    }
  }

  async buy(price, time) {
    try {
      if (this.quote_balance < this.order_size) {
        //Insuficient fund
        return
      }

      await this.create_order({
        type: "BUY",
        time,
        price,
        size: this.order_size,
        stop_loss_limit: this.stop_loss_limit,
        trailing_limit: this.trailing_limit
      })
    } catch (e) {
      logger.error("Trade emulator Buy error ", e)
    }
  }

  async create_order(config) {
    try {
      let quantity = config.size

      if (config.type == "BUY") {
        quantity = util.buy_quantity_by_symbol(config.size, config.price)
      }

      let stop_loss_price = 0
      let trailing_price = 0
      let trailing_limit = 0

      if (config.stop_loss_limit > 0) {
        stop_loss_price = config.price * config.stop_loss_limit
      }

      if (config.trailing_limit > 0) {
        trailing_price = config.price + config.price * config.trailing_limit * 2
        trailing_limit = config.trailing_limit
      }

      let order = {
        price: config.price,
        time: config.time,
        quantity,
        stop_loss_price,
        trailing_price,
        trailing_limit,
        closed: 0,
        balance: this.full_balance()
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

  async update(candle) {
    try {
      this.price = candle.close

      this.orders = this.orders.map((order) => {
        if (order.stop_loss_price > 0 && order.stop_loss_price >= this.price && order.closed == 0) {
          this.quote_balance += (order.quantity * this.price) / (1 + this.fee * 2)
          this.asset_balance -= order.quantity

          this.order_history.push(order)

          order.sold = this.price
          order.closed = candle.time
          order.close_type = "Stop-loss"
          order.balance = this.full_balance()
        }

        if (order.trailing_limit > 0 && this.price >= order.trailing_price && order.closed == 0) {
          order.stop_loss_price = this.price - this.price * order.trailing_limit
          order.trailing_price = this.price + this.price * order.trailing_limit
        }

        return order
      })
    } catch (e) {
      logger.error("Trade emulator update error ", e)
    }
  }

  full_balance() {
    this.order_size = (this.quote_balance / 100) * this.portion_pct
    return this.quote_balance + this.asset_balance * this.price
  }
}

module.exports = TradeEmulator
