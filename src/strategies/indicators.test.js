/* eslint-disable no-undef */
"use strict"

const talib = require("talib")

// Check Talib working
test("Talib", async () => {
  var function_desc = talib.explain("ADX")

  expect(function_desc.name).toBe("ADX")
})
