/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const TA_indicators = require("./index")

// Check Abstract Strategy class
test("Abstract Strategy Test algo", () => {
  const SMA = new TA_indicators({ label: "SMA_5", update_interval: 60, ta_name: "SMA", params: 5, params2: "open" })

  let result = -1

  for (let i = 0; i < 6; i++) {
    let candlestick = {
      time: 1563625680000 + i,
      open: 1000 * Math.random(),
      high: 1000 * Math.random(),
      low: 1000 * Math.random(),
      close: 1000 * Math.random(),
      volume: 1000 * Math.random()
    }

    result = SMA.update(candlestick)
  }

  expect(result === SMA.result).toBe(true)
})
