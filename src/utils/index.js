"use strict";
const fs = require("fs");
const _ = require("lodash");

const util = {
  minMaxScaler: data => {
    let min = Math.min(...data);
    let max = Math.max(...data);

    let scaledData = data.map(value => {
      return (value - min) / (max - min);
    });

    return scaledData;
  },

  file_create: filename => {
    fs.writeFileSync(filename, "");
  },

  file_append: (filename, data) => {
    fs.appendFileSync(filename, data);
  },

  round: (value, dec = 2) => {
    let coeff = Math.pow(10, dec);

    return Math.round(value * coeff) / coeff;
  },

  // Machine learning rounding
  round_array: (array, dec = 2) => {
    let coeff = Math.pow(10, dec);
    let new_array = [];

    for (let i = 0; i < array.length; i++) {
      new_array[i] = Math.round(array[i] * coeff) / coeff;
    }

    // array.map(elem => Math.round(elem * coeff) / coeff);

    return new_array;
  },

  // Realtime
  realtime: () => {
    let offset = new Date().getTimezoneOffset() * 60000;
    let number = Date.now() + offset;

    return number;
  },

  // Timestamp to string
  TimestampToString: number => {
    let offset = new Date().getTimezoneOffset() * 60000;
    let date = new Date(number + offset);
    let string = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    return string;
  },

  // Twitter time standardizer
  StringtoTimestamp: string => {
    return new Date(string).getTime();
  },

  // Binance trade round
  round_by_symbol: (amount, symbol, tradeinfo) => {
    let stepsize = tradeinfo.filter(elem => elem.symbol == symbol)[0].stepsize;

    let power_val = 1;

    switch (Number(stepsize)) {
      case 0.000001:
        power_val = 6;
        amount = amount * Math.pow(10, power_val);
        amount = Math.floor(amount);
        amount = amount / Math.pow(10, power_val);
        break;
      case 0.00001:
        power_val = 5;
        amount = amount * Math.pow(10, power_val);
        amount = Math.floor(amount);
        amount = amount / Math.pow(10, power_val);
        break;
      case 0.001:
        power_val = 3;
        amount = amount * Math.pow(10, power_val);
        amount = Math.floor(amount);
        amount = amount / Math.pow(10, power_val);
        break;
      case 0.01:
        power_val = 2;
        amount = amount * Math.pow(10, power_val);
        amount = Math.floor(amount);
        amount = amount / Math.pow(10, power_val);
        break;
      case 0.1:
        power_val = 1;
        amount = amount * Math.pow(10, power_val);
        amount = Math.floor(amount);
        amount = amount / Math.pow(10, power_val);
        break;
      default:
        amount = parseInt(amount);
        break;
    }

    return amount;
  },

  // Get buy_quantity
  buy_quantity_by_symbol: (spendable_balance, symbol, prices) => {
    let quantity = 0;
    let price = prices.filter(elem => elem.symbol == symbol)[0].price;

    quantity = Number(spendable_balance) / Number(price);

    return quantity;
  },

  // Spendable balance
  spendable_balance: (
    quote,
    quote_balance,
    prices,
    buy_partion_pct,
    buy_partion_min_usd
  ) => {
    // We belive in USDT
    // console.log(prices);

    let ratio = {};
    let buy_quantity = 0;

    switch (quote) {
      case "BTC":
        ratio = prices.filter(elem => elem.symbol == "BTCUSDT")[0];
        break;
      case "ETH":
        ratio = prices.filter(elem => elem.symbol == "ETHUSDT")[0];
        break;
      case "BNB":
        ratio = prices.filter(elem => elem.symbol == "BNBUSDT")[0];
        break;

      default:
        ratio.price = 1;
        break;
    }

    let usd_balance = Number(ratio.price) * Number(quote_balance);

    // Expected buy in
    let buy_pct_value_usd = usd_balance * (buy_partion_pct / 100);

    // If we have a lot of money
    if (buy_pct_value_usd > buy_partion_min_usd) {
      buy_quantity = buy_pct_value_usd / ratio.price;
      return buy_quantity;
    }

    // If we got money only for 2 buy in + 10% safety
    if (usd_balance > buy_partion_min_usd * 2.1) {
      buy_quantity = buy_partion_min_usd / ratio.price;
      return buy_quantity;
    }

    // If we got only left over
    if (usd_balance > buy_partion_min_usd) {
      buy_quantity = _.round(usd_balance * 0.95, 2) / ratio.price;
      return buy_quantity;
    }

    return buy_quantity;
  },

  quote_amount_by_usdt: (quote, usdt, prices) => {
    switch (quote) {
      case "BTC":
        ratio = prices.filter(elem => elem.symbol == "BTCUSDT")[0];
        break;
      case "ETH":
        ratio = prices.filter(elem => elem.symbol == "ETHUSDT")[0];
        break;
      case "BNB":
        ratio = prices.filter(elem => elem.symbol == "BNBUSDT")[0];
        break;

      default:
        ratio.price = 1;
        break;
    }

    let quote_amount = Number(usdt) / Number(ratio.price);

    return quote_amount;
  },

  usdt_price: (asset, amount, prices) => {
    let btc_amount = 0;

    if (asset != "BTC") {
      btc_amount =
        prices.filter(elem => elem.symbol == `${asset}BTC`)[0].price * amount;
    } else {
      btc_amount = amount;
    }

    let usdt =
      prices.filter(elem => elem.symbol == "BTCUSDT")[0].price * btc_amount;

    return usdt;
  },

  // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  interval_toString: number => {
    let string = "";
    switch (number) {
      case 60:
        string = "1m";
        break;
      case 180:
        string = "3m";
        break;
      case 300:
        string = "5m";
        break;
      case 900:
        string = "15m";
        break;
      case 1800:
        string = "30m";
        break;
      case 3600:
        string = "1h";
        break;
      case 7200:
        string = "2h";
        break;
      case 14400:
        string = "4h";
        break;
      case 28800:
        string = "8h";
        break;
      case 43200:
        string = "12h";
        break;
      case 86400:
        string = "24h";
        break;
      default:
        string = "1m";
        break;
    }

    return string;
  },

  history_limit: () => {
    /* time * millisec * day */
    let limit = process.env.history_timeframe * 1000 * 86400;

    let time = Date.now() - limit;

    return time;
  },

  candlestick_name: (exchange, symbol, interval) => {
    let name = exchange + "_" + symbol + "_" + util.interval_toString(interval);

    //Lowercase only
    return name.toLowerCase();
  },

  removeFalsy: obj => {
    let newObj = {};
    Object.keys(obj).forEach(prop => {
      if (obj[prop]) {
        newObj[prop] = obj[prop];
      }
    });
    return newObj;
  },

  candlestick_data_integrity: (data, invertval) => {
    let interval_msec = parseInt(invertval * 1000); //millisec
    if (data.length == 0) return false;

    let outages = [];

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i + 1]["time"] - data[i]["time"] > interval_msec * 10) {
        outages.push(data[i]["time"]);
      }
    }

    return outages;
  }
};

module.exports = util;
