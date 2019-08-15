/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const Abstract_Strategy = require("./index")

// Check Abstract Strategy class
test("Abstract Strategy", () => {
  const Strategy = new Abstract_Strategy()

  expect(typeof Strategy == "object").toBe(true)
})

test("Abstract Strategy Step Counter", () => {
  const Strategy = new Abstract_Strategy()

  Strategy.add_TA({ label: "SMA_5", update_interval: 60, ta_name: "SMA", params: 5, params2: "ohlcv/4" })

  for (let i = 0; i <= 1000; i++) {
    let candlestick = {
      time: 1563625680000 + i,
      open: 1000 * Math.random(),
      high: 1000 * Math.random(),
      low: 1000 * Math.random(),
      close: 1000 * Math.random(),
      volume: 1000 * Math.random()
    }

    Strategy.update_TA(candlestick, 60)
  }

  expect(Strategy.BUFFER.SMA_5.length[Strategy.BUFFER.SMA_5.length - 1] == Strategy.BUFFER.SMA_5.length[Strategy.step]).toBe(true)
})

test("Abstract Strategy Multi TA Snapshot", () => {
  const Strategy = new Abstract_Strategy()

  Strategy.add_TA({ label: "SMA_5", update_interval: 60, ta_name: "SMA", params: 5, params2: "ohlcv/4" })
  Strategy.add_TA({ label: "SMA_10", update_interval: 60, ta_name: "SMA", params: 10, params2: "ohlcv/4" })
  Strategy.add_TA({ label: "MACD", update_interval: 60, ta_name: "MACD", params: { short: 3, long: 15, signal: 10 }, params2: "ohlcv/4" })
  Strategy.add_TA({ label: "RSI", update_interval: 60, ta_name: "RSI", params: 10 })

  for (let i = 0; i <= 1000; i++) {
    let candlestick = {
      time: 1563625680000 + i,
      open: 1000 * Math.random(),
      high: 1000 * Math.random(),
      low: 1000 * Math.random(),
      close: 1000 * Math.random(),
      volume: 1000 * Math.random()
    }

    Strategy.update_TA(candlestick, 60)
  }

  let snapshot = Strategy.snapshot_BUFFER(10)

  // Last Snapshot value equal with last TA last result
  expect(snapshot[snapshot.length - 1] == Strategy.BUFFER.RSI[Strategy.step]).toBe(true)
})
