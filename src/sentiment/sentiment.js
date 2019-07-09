"user strict";
const _ = require("lodash");
const util = require("../utils");
const twitter = require("./twitter");

class Sentiment {
  async twitter_chart(asset, from_time = 0, interval_in_sec = 900) {
    let chart = await twitter.create_twitter_chart(
      asset,
      from_time,
      interval_in_sec
    );

    return chart;
  }
}

module.exports = new Sentiment();
