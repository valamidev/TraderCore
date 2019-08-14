"use strict"

const _ = require("lodash")
const logger = require("../../logger")
const TA_indicators = require("../../indicators")

class Abstract_Strategy {
  constructor() {
    this.BUFFER = {}
    this.TA = {}
    this.step = -1

    this.add_BUFFER("candle")
    this.add_BUFFER("candle_mid")
  }

  update_TA(candledata = [], candleinterval = 60) {
    try {
      // Update TA functions
      Object.keys(this.TA).map((label) => {
        if (this.TA[label].update_interval === candleinterval) {
          this.TA[label].update(candledata)
        }
      })
      /* TODO ADD different intervals and batching */

      this.update_BUFFER()
    } catch (e) {
      logger.error("Abstract_Strategy TA Update error ", e)
    }
  }

  update_BUFFER() {
    Object.keys(this.TA).map((label) => {
      this.BUFFER[label].push(this.TA[label].result)
    })

    this.step++
  }

  add_TA(config) {
    try {
      let label = config.label

      if (typeof this.BUFFER[label] == "undefined" && typeof this.TA[label] == "undefined") {
        this.TA[label] = new TA_indicators(config)

        this.add_BUFFER(label)
      }
    } catch (e) {
      logger.error("Abstract_Strategy Add TA error ", e)
    }
  }

  add_BUFFER(name) {
    if (typeof this.BUFFER[name] == "undefined") {
      this.BUFFER[name] = []
    }
  }

  snapshot_BUFFER(frame_length = 10) {
    try {
      let snapshot = []

      for (let k = frame_length; k >= 0; k--) {
        Object.keys(this.TA).map((label) => {
          snapshot.push(this.BUFFER[label][this.step - k])
        })
      }

      return snapshot
    } catch (e) {
      console.log(e)
      logger.error("Abstract_Strategy ML_data_snapshot", e)
    }
  }
}

module.exports = Abstract_Strategy
