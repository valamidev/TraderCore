import { logger } from '../logger';
import { BaseDB } from '../database';
import { RowDataPacket } from 'mysql2';

export const tradeUtils = {
  insertAccountOrdersToDB: async (resp: any, instanceId: number): Promise<void> => {
    try {
      const time = Date.now();

      /*
              info: {},
              id: '31865059',
              timestamp: 1563975044422,
              datetime: '2019-07-24T13:30:44.422Z',
              lastTradeTimestamp: undefined,
              symbol: 'HC/BTC',
              type: 'limit',
              side: 'sell',
              price: 0.000308,
              amount: 1,
              cost: 0,
              average: undefined,
              filled: 0,
              remaining: 1,
              status: 'open',
              fee: undefined,
              trades: undefined
      */
      const closed = 0;

      const data = [
        resp.id,
        instanceId,
        time,
        resp.timestamp,
        resp.datetime,
        resp.lastTradeTimestamp,
        resp.symbol,
        resp.type,
        resp.side,
        resp.price,
        resp.amount,
        resp.cost,
        resp.average,
        resp.filled,
        resp.remaining,
        resp.status,
        resp.fee,
        resp.trades,
        JSON.stringify(resp.info),
        closed,
      ];

      await BaseDB.query(
        'INSERT INTO `account_orders` (`id`, `instance_id`, `time`, `timestamp`, `datetime`, `lastTradeTimestamp`, `symbol`, `type`, `side`, `price`, `amount`, `cost`, `average`, `filled`, `remaining`, `status`, `fee`, `trades`, `info`,`closed`) VALUES ?;',
        [[data]],
      );

      return;
    } catch (e) {
      logger.error('SQL error', e);
    }
  },

  closeAccountTradesDB: async (orderId: string): Promise<void> => {
    try {
      await BaseDB.query('UPDATE `account_orders` SET `closed` = 1 WHERE `id` = ? LIMIT 1;', [orderId]);
    } catch (e) {
      logger.error('SQL error', e);
    }
  },

  getLastTradesByInstanceToDB: async (instanceId: number): Promise<RowDataPacket[] | undefined> => {
    try {
      const [rows] = await BaseDB.query("SELECT * FROM `account_orders` WHERE `instance_id` = ? AND `type` LIKE 'LIMIT' AND `closed` = 0 ORDER BY `account_orders`.`time` DESC;", [
        instanceId,
      ]);

      return rows as RowDataPacket[];
    } catch (e) {
      logger.error('SQL error', e);
    }
  },

  setTradeInstanceBalance: async (instanceId: number, balanceAsset: number, balanceQuote: number, orderBalanceAsset: number, orderBalanceQuote: number): Promise<void> => {
    try {
      await BaseDB.query(
        'UPDATE `account_trader_instances` SET `asset_balance` = ?, `quote_balance` = ? , `order_asset_balance` = ?, `order_quote_balance` = ? WHERE `guid` = ?;',
        [balanceAsset, balanceQuote, orderBalanceAsset, orderBalanceQuote, instanceId],
      );
    } catch (e) {
      logger.error('SQL error', e);
    }
  },

  getTradeAdviceFromDB: async (algoName: string, time = 0): Promise<RowDataPacket[] | undefined> => {
    try {
      const [
        rows,
      ] = await BaseDB.query(
        'SELECT DISTINCT `trade_advice`.`symbol`, `action`, `prevActionIfNotIdle`,  `time`, `asset`, `quote`, `close` FROM `trade_advice` JOIN tradepairs ON trade_advice.symbol = tradepairs.symbol WHERE algo = ? and time > ? ORDER BY `time` DESC LIMIT 500;',
        [algoName, time],
      );

      return rows as RowDataPacket[];
    } catch (e) {
      logger.error('SQL error', e);
    }
  },
};
