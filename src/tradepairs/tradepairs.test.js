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

  let { exchange, symbol, interval_sec } = tradepairs[0]

  let candlestick = await Tradepairs.get_candlestick(exchange, symbol, interval_sec, 100)

  expect(candlestick.length > 0).toBe(true)
})

test("Load first tradepair Tick Chart", async () => {
  let tradepairs = await Tradepairs.load_tradepairs()

  let { exchange, symbol } = tradepairs[0]

  let tick_chart = await Tradepairs.get_tickchart(exchange, symbol, 5, 0)

  expect(tick_chart).toBeDefined()
})

test("Load first tradepair Candlestick from Trades", async () => {
  let tradepairs = await Tradepairs.load_tradepairs()

  let { exchange, symbol, interval_sec } = tradepairs[0]

  let candlestick2 = await Tradepairs.get_candlestick_from_trade(exchange, symbol, interval_sec, 0)

  expect(candlestick2).toBeDefined()
})
