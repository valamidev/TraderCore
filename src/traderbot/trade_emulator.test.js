/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const Trade_emulator = require("./trade_emulator")

test("Trade emulator Trailing / Stoploss test", () => {
  const Trades = new Trade_emulator({ stop_loss_limit: 0.98, portion_pct: 10 })

  let price = 5000

  Trades.action({ action: "BUY", price, time: Date.now() })
  Trades.update({
    time: 1,
    open: 5000,
    high: 5000,
    low: 5000,
    close: 5000,
    volume: 5000
  })
  Trades.update({
    time: 2,
    open: 5000,
    high: 5000,
    low: 5000,
    close: 6000,
    volume: 5000
  })
  Trades.update({
    time: 3,
    open: 6000,
    high: 5000,
    low: 5000,
    close: 6000,
    volume: 5000
  })
  Trades.update({
    time: 3,
    open: 5500,
    high: 5000,
    low: 5000,
    close: 5500,
    volume: 5000
  })

  expect(Trades.order_size).toBe(100)
  expect(Trades.stop_loss_limit).toBe(0.98)
  expect(Trades.quote_balance > 1009).toBe(true) // 1009.7804391217564
})
