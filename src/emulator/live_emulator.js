"use strict";
const logger = require("../logger");
const _ = require("lodash");
const tradepairs = require("../tradepairs/tradepairs");
const Emulator = require("./emulator");
const pool = require("../database");

class LiveEmulator {
  constructor() {
    this.simulations = [];
    this.performance = [];
    this.hot_start_limit = 3000;
  }

  // Load all strategies
  async start() {
    try {
      this.simulations = await this.load_strategies();

      let promise_start = [];

      for (let i = 0; i < this.simulations.length; i++) {
        let candledata = await tradepairs.get_candlestick(
          this.simulations[i].exchange,
          this.simulations[i].symbol,
          this.simulations[i].interval_sec,
          this.hot_start_limit
        );

        this.simulations[i].emulator = new Emulator(this.simulations[i]);

        promise_start.push(this.simulations[i].emulator.start(candledata));
      }

      await Promise.all(promise_start);

      logger.info(`Live emulators started, count: ${this.simulations.length}`);

      // Set update loop every 5 sec
      setInterval(async () => {
        await this.update_loop();
      }, 5000);
      // Set update loop every 5 sec
    } catch (e) {
      logger.error("Live Emulator start error ", e);
    }
  }

  async reload_strategies() {
    try {
      // Only add new strategies never delete old ones avoid overwrites /* TODO it need an other level of abstraction */
      let promise_start = [];
      let all_simulations = await this.load_strategies();
      let count = 0;

      for (let i = 0; i < all_simulations.length; i++) {
        let new_simulation = all_simulations[i];

        // If this -1 strategy is not loaded (new)
        if (
          _.findIndex(this.simulations, { guid: new_simulation.guid }) == -1
        ) {
          let candledata = await tradepairs.get_candlestick(
            new_simulation.exchange,
            new_simulation.symbol,
            new_simulation.interval_sec,
            this.hot_start_limit
          );

          this.simulations.push(new_simulation);

          let new_index = this.simulations.length - 1;

          this.simulations[new_index].emulator = new Emulator(
            this.simulations[new_index]
          );

          promise_start.push(
            this.simulations[new_index].emulator.start(candledata)
          );
          count++;
        }
      }

      await Promise.all(promise_start);

      if (count > 0) {
        logger.verbose(`New live strategy(s) loaded count : ${count}`);
      }
    } catch (e) {
      logger.error("Live Emulator reload error ", e);
    }
  }

  /* Mass update on all strategy  */
  async update_loop() {
    try {
      let update_loop_promises = [];
      let time = Date.now();

      for (let i = 0; i < this.simulations.length; i++) {
        update_loop_promises.push(this.single_update(i));
      }

      await Promise.all(update_loop_promises);

      logger.verbose(
        `Live strategies updated, count: ${
          this.simulations.length
        } , time: ${time} last_candle: ${
          this.simulations[0].emulator.last_update.time
        } `
      );

      this.reload_strategies();

      return;
    } catch (e) {
      logger.error("Live Emulator update loop error ", e);
    }
  }

  /* Helper function for Update loop */
  async single_update(strategies_id) {
    try {
      let guid = strategies_id;

      // Be sure that emulator is Ready for update
      if (this.simulations[guid].emulator.state != "Ready") return;

      let candledata = await tradepairs.get_candlestick(
        this.simulations[guid].exchange,
        this.simulations[guid].symbol,
        this.simulations[guid].interval_sec,
        10
      );

      // Get count of the updated candledatas
      let update_tick = await this.simulations[guid].emulator.update(
        candledata
      );

      // Validate that strategy got updated
      if (update_tick > 0) {
        // Save new advice otherwise Idle
        if (
          this.simulations[guid].emulator.last_advice !==
          this.simulations[guid].last_advice
        ) {
          this.simulations[guid].last_advice = this.simulations[
            guid
          ].emulator.last_advice;
          this.save_advice(
            this.simulations[guid],
            this.simulations[guid].emulator.last_advice
          );
        } else {
          this.save_advice(this.simulations[guid], "IDLE");
        }
      }
    } catch (e) {
      logger.error("Live Emulator single update error ", e);
    }
  }

  async get_performance() {
    this.performance = [];

    for (let i = 0; i < this.simulations.length; i++) {
      let singe_performance = [
        {
          symbol: this.simulations[i].symbol,
          exchange: this.simulations[i].exchange,
          config: this.simulations[i].strategy_config,
          virtual_balance: this.simulations[i].emulator.quote_balance,
          trade_history: this.simulations[i].emulator.action_list
        }
      ];

      this.performance.push(singe_performance);
    }

    return this.performance;
  }

  async load_strategies() {
    try {
      let [rows] = await pool.query(
        "SELECT `guid`,`symbol`,`exchange`,`strategy`,`strategy_config`,`interval_sec` FROM `trade_strategies` ORDER BY `guid` ASC;"
      );

      return rows;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }

  async save_advice(simulation, action) {
    try {
      await pool.query(
        "INSERT INTO `trade_advice` (`strategy`, `strategy_guid`, `strategy_config`, `symbol`, `exchange`, `action` , `time`,`close`  ) VALUES (?, ?,? ,? ,? ,? ,? , ?);",
        [
          simulation.strategy,
          simulation.guid,
          JSON.stringify(simulation.strategy_config), // JSON
          simulation.symbol,
          simulation.exchange,
          action,
          simulation.emulator.last_update.time,
          simulation.emulator.last_update.close
        ]
      );

      return;
    } catch (e) {
      logger.error("SQL error", e);
    }
  }
}

module.exports = new LiveEmulator();
