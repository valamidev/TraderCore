/* eslint-disable no-undef */
"use strict"
require("dotenv").config()

const Abstract_Strategy_Test_Algo = require("./index")

// Check Abstract Strategy class
test("Abstract Strategy Test algo", () => {
  const Strategy = new Abstract_Strategy_Test_Algo()

  expect(typeof Strategy == "object").toBe(true)
})
