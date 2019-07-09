"use strict";

const _ = require("lodash");
const logger = require("../../logger");
const util = require("../../utils");
const pool = require("../../database");

class TwitterAPI {
  async create_twitter_chart(asset, from_time = 0, interval_in_sec = 900) {
    try {
      let data = await this.get_data_asset(asset, from_time);

      let interval = interval_in_sec * 1000;

      // Get stroed time intervals
      let time_first = util.StringtoTimestamp(_.head(data).created_at);
      let time_last = util.StringtoTimestamp(_.last(data).created_at);

      let j = 0;
      let count = 0;
      let sum_followers = 0;
      let sum_listed = 0;
      let result = [];

      // Loop every interval section in the stored data range
      for (
        let time = time_first + interval;
        time < time_last;
        time = time + interval
      ) {
        //Loop the strored data inside the intervals and move the pointer for optimal speed
        for (let i = j; i < data.length; i++) {
          if (util.StringtoTimestamp(data[i].created_at) < time) {
            count++;
            sum_followers += data[i].followers;
            sum_listed += data[i].listed;
            j++;
          } else {
            result.push([
              time, //open
              time + interval, //close
              count,
              sum_followers,
              sum_listed
            ]);
            count = 0;
            sum_followers = 0;
            sum_listed = 0;
            break;
          }
        }
      }

      return result;
    } catch (e) {
      logger.error("Twitter chart error ", e);
    }
  }

  /* Database queries */

  async get_data_asset(asset, time = 0) {
    try {
      let $asset = `$${asset}`;

      let [rows] = await pool.query(
        "SELECT * FROM `sentiment_twitter` WHERE `asset` = ? AND `time` > ?  ORDER BY `time` ASC;",
        [$asset, time]
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }
}

module.exports = new TwitterAPI();
