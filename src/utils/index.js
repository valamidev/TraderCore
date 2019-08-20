"use strict"
const fs = require("fs")

const util = {
  minMaxScaler: (data) => {
    let min = Math.min(...data)
    let max = Math.max(...data)

    let scaledData = data.map((value) => {
      return (value - min) / (max - min)
    })

    return scaledData
  },

  file_create: (filename) => {
    fs.writeFileSync(filename, "")
  },

  file_append: (filename, data) => {
    fs.appendFileSync(filename, data)
  },

  round: (value, dec = 2) => {
    let coeff = Math.pow(10, dec)

    return Math.round(value * coeff) / coeff
  },

  // Machine learning rounding
  round_array: (array, dec = 2) => {
    let coeff = Math.pow(10, dec)
    let new_array = []

    for (let i = 0; i < array.length; i++) {
      new_array[i] = Math.round(array[i] * coeff) / coeff
    }

    // array.map(elem => Math.round(elem * coeff) / coeff);

    return new_array
  },

  // Realtime
  realtime: () => {
    let offset = new Date().getTimezoneOffset() * 60000
    let number = Date.now() + offset

    return number
  },

  // Timestamp to string
  TimestampToString: (number) => {
    let offset = new Date().getTimezoneOffset() * 60000
    let date = new Date(number + offset)
    let string = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`

    return string
  },

  // Twitter time standardizer
  StringtoTimestamp: (string) => {
    return new Date(string).getTime()
  },

  // Binance trade round
  round_by_symbol: (amount, symbol, tradeinfo) => {
    let stepsize = tradeinfo.find((elem) => elem.symbol == symbol).stepsize

    let power_val = 1

    switch (Number(stepsize)) {
      case 0.000001:
        power_val = 6
        amount = amount * Math.pow(10, power_val)
        amount = Math.floor(amount)
        amount = amount / Math.pow(10, power_val)
        break
      case 0.00001:
        power_val = 5
        amount = amount * Math.pow(10, power_val)
        amount = Math.floor(amount)
        amount = amount / Math.pow(10, power_val)
        break
      case 0.001:
        power_val = 3
        amount = amount * Math.pow(10, power_val)
        amount = Math.floor(amount)
        amount = amount / Math.pow(10, power_val)
        break
      case 0.01:
        power_val = 2
        amount = amount * Math.pow(10, power_val)
        amount = Math.floor(amount)
        amount = amount / Math.pow(10, power_val)
        break
      case 0.1:
        power_val = 1
        amount = amount * Math.pow(10, power_val)
        amount = Math.floor(amount)
        amount = amount / Math.pow(10, power_val)
        break
      default:
        amount = parseInt(amount)
        break
    }

    return amount
  },

  // Get buy_quantity
  buy_quantity_by_symbol: (spendable_balance, price) => {
    let quantity = 0

    quantity = Number(spendable_balance) / Number(price)

    return quantity
  },

  // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  interval_toNumber: (string) => {
    let number = 0
    switch (string) {
      case "1m":
        number = 60
        break
      case "3m":
        number = 180
        break
      case "5m":
        number = 300
        break
      case "15m":
        number = 900
        break
      case "30m":
        number = 1800
        break
      case "1h":
        number = 3600
        break
      case "2h":
        number = 7200
        break
      case "4h":
        number = 14400
        break
      case "8h":
        number = 28800
        break
      case "12h":
        number = 43200
        break
      case "24h":
        number = 86400
        break
      default:
        number = 60
        break
    }

    return number
  },

  // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  interval_toString: (number) => {
    let string = ""
    switch (number) {
      case 60:
        string = "1m"
        break
      case 180:
        string = "3m"
        break
      case 300:
        string = "5m"
        break
      case 900:
        string = "15m"
        break
      case 1800:
        string = "30m"
        break
      case 3600:
        string = "1h"
        break
      case 7200:
        string = "2h"
        break
      case 14400:
        string = "4h"
        break
      case 28800:
        string = "8h"
        break
      case 43200:
        string = "12h"
        break
      case 86400:
        string = "24h"
        break
      default:
        string = "1m"
        break
    }

    return string
  },

  history_limit: () => {
    /* time * millisec * day */
    let limit = process.env.history_timeframe * 1000 * 86400

    let time = Date.now() - limit

    return time
  },

  candlestick_data_integrity: (data, invertval) => {
    let interval_msec = parseInt(invertval * 1000) //millisec
    if (data.length == 0) return false

    let outages = []

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i + 1]["time"] - data[i]["time"] > interval_msec * 10) {
        outages.push(data[i]["time"])
      }
    }

    return outages
  },

  /*  StockML generic naming  */

  trades_name: (exchange, symbol) => {
    symbol = symbol.replace("/", "")
    symbol = symbol.replace("-", "")
    symbol = symbol.replace("_", "")

    let name = `${exchange}_${symbol}_trades`

    //Lowercase only
    return name.toLowerCase()
  },

  orderbook_name: (exchange, symbol) => {
    symbol = symbol.replace("/", "")
    symbol = symbol.replace("-", "")
    symbol = symbol.replace("_", "")

    let name = `${exchange}_${symbol}_orderbook`

    //Lowercase only
    return name.toLowerCase()
  },

  candlestick_name: (exchange, symbol, interval) => {
    symbol = symbol.replace("/", "")
    symbol = symbol.replace("-", "")
    symbol = symbol.replace("_", "")

    if (Number.isInteger(interval)) {
      interval = util.interval_toString(interval)
    }

    let name = `${exchange}_${symbol}_${interval}`

    //Lowercase only
    return name.toLowerCase()
  },

  livefeed_name: (exchange, interval) => {
    if (Number.isInteger(interval)) {
      interval = util.interval_toString(interval)
    }

    let name = `livefeed_${exchange}_${interval}`

    //Lowercase only
    return name.toLowerCase()
  },

  livefeed_trades: (exchange) => {
    let name = `livefeed_${exchange}_trades`

    //Lowercase only
    return name.toLowerCase()
  }
}

module.exports = util
