"use strict";
const fs = require("fs");
const f = parseFloat;

const util = {
  middle_price: (assetVolume, volume) => {
    let result = 0;

    if (volume > 0) result = f(assetVolume) / f(volume);

    return f(result);
  }
};

module.exports = util;
