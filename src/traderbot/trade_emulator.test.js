/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const Trade_emulator = require("./trade_emulator")

test("Trade emulator Trailing / Stoploss test", () => {
  const Trades = new Trade_emulator({ stop_loss_limit: 0.98 })

  let price = 5000

  Trades.action({ action: "BUY", price })

  Trades.update(5500)

  Trades.update(5700)

  Trades.update(5670)

  Trades.update(6000)

  Trades.update(5830)

  Trades.update(5500)

  expect(Trades.quote_balance > 1016).toBe(true) // 1016.3672654690619
})

/*
test("Trade emulator", () => {
  const Trades = new Trade_emulator({ stop_loss_limit: 0.98, trailing_limit: 0.01 })

  let price = 5000

  for (let i = 0; i < 30000; i++) {
    let rand_action = Math.random()
    let price_change = price * (Math.random() / 1000)
    let price_change_direction = Math.random()

    if (price_change_direction > 0.4) {
      price += price_change
    } else {
      price -= price_change
    }

    if (rand_action > 0.5) {
      Trades.action({ action: "BUY", price })
    } else {
      Trades.update(price)
    }
  }
  Trades.update(price)

  console.log(`Full balance: ${Trades.full_balance()}`)
})
*/
