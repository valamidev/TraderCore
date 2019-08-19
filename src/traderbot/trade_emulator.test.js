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

  expect(Trades.order_size > 100).toBe(true)
  expect(Trades.stop_loss_limit).toBe(0.98)
  expect(Trades.quote_balance > 1009).toBe(true) // 1009.7804391217564
})

/*
test("Trade emulator prove test", () => {
  const Trades = new Trade_emulator({ stop_loss_limit: 0.8, trailing_limit: 0.075, portion_pct: 10 })

  let price = 5000

  let count = 5000

  for (let i = 0; i < count; i++) {
    let rand_buy = Math.random()
    let random_price_change = Math.random() / 100
    let random_direction = Math.random()

    if (random_direction > 0.48) {
      price += price * random_price_change
    } else {
      price -= price * random_price_change
    }

    Trades.update({
      time: Date.now() + i * 60000,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 100
    })

    if (rand_buy > 0.8) {
      Trades.action({ action: "BUY", price, time: Date.now() })
    }
  }

  console.log("Number of trades: ", Trades.order_history.length)
  console.log("Balance: ", Trades.full_balance(), "Price at end: ", price)
  console.log("Hodl profit: ", price / 5000, "Trading profit", Trades.full_balance() / 1000)
  
  expect(true).toBe(true) // 1009.7804391217564
})
*/
