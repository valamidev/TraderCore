/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const Tradepairs = require("./tradepairs")

// Load all tradepairs
test("Load all tradepairs", async () => {
  let tradepairs = await Tradepairs.load_tradepairs()

  expect(tradepairs).toBeDefined()
})

test("Load first tradepair Candlestick", async () => {
  let tradepairs = await Tradepairs.load_tradepairs()

  let { exchange, symbol } = tradepairs[0]

  let candlestick = await Tradepairs.get_candlestick(exchange, symbol, 60, 100)

  expect(candlestick.length > 0).toBe(true)
})

test("Load first tradepair Tick Chart", async () => {
  let tradepairs = await Tradepairs.load_tradepairs()

  let { exchange, symbol } = tradepairs[0]

  let tick_chart = await Tradepairs.get_tickchart(exchange, symbol, 5, 0)

  expect(tick_chart).toBeDefined()
})

test("Get Batched Candledatas", async () => {
  let tradepairs = await Tradepairs.load_tradepairs()

  let { exchange, symbol } = tradepairs[0]

  let batched_candlestick = await Tradepairs.get_batched_candlestick({ exchange, symbol, intervals_time: [60, 120, 180, 240, 600], limit: 1 })

  expect(batched_candlestick[600].length > 0).toBe(true)
})
