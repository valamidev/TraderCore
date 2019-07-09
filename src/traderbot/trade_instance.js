"use strict";

const trade_util = require("./trade_utils");
const util = require("../utils");
const logger = require("../logger");
const binance = require("../exchange/Binance");

const fee = 1.001;

class TradeInstance {
  constructor(config) {
    //   Config parse
    this.tradeinfo = config.tradeinfo;
    this.instanceID = config.instanceID;
    this.symbol = config.symbol;
    this.asset = config.asset;
    this.quote = config.quote;
    this.asset_balance = config.asset_balance;
    this.quote_balance = config.quote_balance;
    this.order_asset_balance = config.order_asset_balance;
    this.order_quote_balance = config.order_quote_balance;

    this.strategy_guid = config.strategy_guid;
    this.limit_order = config.limit_order;
    this.exchange = config.exchange;
    //   Config parse

    // WARNING EVERY FIELD SYNCED FROM DATABASE DO NOT USE ANY NON DB LOADED VARIABLE!
  }

  async update(advice) {
    try {
      logger.info(`Trade instance update ${advice.action} , ${advice.close}`);

      // Check values
      if (
        typeof advice.action != "undefined" ||
        typeof advice.close != "undefined"
      ) {
        if (advice.action == "BUY") {
          await this.buy(advice.close);
        } else if (advice.action == "SELL") {
          await this.sell(advice.close);
        }
      }

      await this.check_order();

      return;
    } catch (e) {
      logger.error("Trade instance error ", e);
    }
  }

  async sell(price) {
    try {
      let sell_quantity = util.round_by_symbol(
        this.asset_balance,
        this.symbol,
        this.tradeinfo
      );

      logger.info(`SYMBOL: ${this.symbol} SELL QUANTITY: ${sell_quantity}`);

      if (sell_quantity > 0) {
        let response = await binance.limit_sell(
          this.symbol,
          sell_quantity,
          price
        );

        if (typeof response.cummulativeQuoteQty != "undefined") {
          await trade_util.insert_account_trades(response, this.instanceID);

          /* TODO handle amounts correctly */
          await trade_util.set_trade_instance_balance(
            this.instanceID,
            0,
            this.quote_balance,
            this.asset_balance,
            0
          );
        }
      }
    } catch (e) {
      logger.error("Trade instance error sell ", e);
    }
  }

  async buy(price) {
    try {
      let prices = await trade_util.get_prices();

      // Calculate quantity
      let buy_quantity = util.buy_quantity_by_symbol(
        this.quote_balance,
        this.symbol,
        prices
      );
      // Round quantity
      buy_quantity = util.round_by_symbol(
        buy_quantity,
        this.symbol,
        this.tradeinfo
      );

      logger.info(`SYMBOL: ${this.symbol} BUY QUANTITY: ${buy_quantity}`);

      if (buy_quantity > 0) {
        let response = await binance.limit_buy(
          this.symbol,
          buy_quantity,
          price
        );

        if (typeof response.cummulativeQuoteQty != "undefined") {
          await trade_util.insert_account_trades(response, this.instanceID);

          await trade_util.set_trade_instance_balance(
            this.instanceID,
            this.asset_balance,
            0,
            0,
            this.quote_balance
          );
        }
      }
    } catch (e) {
      logger.error("Trade instance error ", e);
    }
  }

  async sync_balance(action, executedQty, cummulativeQuoteQty) {
    try {
      if (action == "BUY") {
        this.asset_balance += executedQty / fee;
        this.quote_balance = 0;
      }

      if (action == "SELL") {
        this.quote_balance += cummulativeQuoteQty / fee;
        this.asset_balance = 0;
      }

      await trade_util.set_trade_instance_balance(
        this.instanceID,
        this.asset_balance,
        this.quote_balance
      );
    } catch (e) {
      logger.error("Trade instance sync balance error ", e);
    }
  }

  async check_order() {
    try {
      let time = Date.now();

      let order = await trade_util.get_last_trades_by_instance(this.instanceID);

      if (order.length != 0) {
        let order_info = await binance.order_status(
          this.symbol,
          order[0].orderId
        );

        console.log(order_info);

        console.log(
          "Order balances",
          this.order_asset_balance,
          this.order_quote_balance
        );

        // Order completed!
        if (order_info.status == "FILLED") {
          logger.verbose(
            `Order filled ${order_info.orderId} , ${order_info.executedQty} , ${
              order_info.cummulativeQuoteQty
            }`
          );

          await trade_util.close_acccount_trades(order_info.orderId);

          await this.sync_balance(
            order_info.side,
            order_info.executedQty,
            order_info.cummulativeQuoteQty
          );
        }

        if (order_info.status == "NEW") {
        }

        if (order_info.status == "PARTIALLY_FILLED") {
        }

        if (order_info.status == "CANCELED") {
          await trade_util.close_acccount_trades(order_info.orderId);

          await trade_util.set_trade_instance_balance(
            this.instanceID,
            this.order_asset_balance,
            this.order_quote_balance,
            0,
            0
          );
        }
      }
    } catch (e) {
      logger.error("Trade instance order check error ", e);
    }
  }

  // End of class
}

module.exports = TradeInstance;
