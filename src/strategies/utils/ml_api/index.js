"use strict";

const _ = require("lodash");
const logger = require("../../../logger");

// Tensorflow http api
const axios = require("axios");

const ml_api = {
  predict: async (input, name) => {
    let result = [0, 0];

    let predict = await axios.post(
      "http://localhost:3000/" + name + "/predict",
      {
        input
      }
    );

    if (predict) {
      result = predict.data;
    }

    return result;
  }
};

module.exports = ml_api;
