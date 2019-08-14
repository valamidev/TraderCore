/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const Abstract_Strategy = require("./index")

// Check Abstract Strategy class
test("Abstract Strategy", () => {
  const Strategy = new Abstract_Strategy()

  expect(typeof Strategy == "object").toBe(true)
  expect(Array.isArray(Strategy.BUFFER.candle)).toBe(true)
  expect(Array.isArray(Strategy.BUFFER.candle_mid)).toBe(true)

  Strategy.add_TA({ label: "SMA_5", update_interval: 60, ta_name: "SMA", params: 5, params2: "ohlcv/4" })

  Strategy.update_TA([2], 60)

  Strategy.snapshot_BUFFER()
})
