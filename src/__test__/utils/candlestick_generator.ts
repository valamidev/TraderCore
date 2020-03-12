import CandleConvert, { OHLCV } from 'candlestick-convert';
import { batchedOHLCV } from '../../types';
import { EXCHANGE_BASE_INTERVAL_IN_SEC } from '../../constants';

const timeStep = 60 * 1000;
const defaultTime = 1583925360000;

export const fakeBatchedCandlestickMap = (intervalsTimeInSec: number[], limit: number): batchedOHLCV => {
  const limitCandlestick = ~~(limit + ((Math.max(...intervalsTimeInSec) as number) / EXCHANGE_BASE_INTERVAL_IN_SEC) * 1.5);

  const batch = {};
  const result = new Map();

  const candledata = [...Array(limitCandlestick)].map((_e, i) => {
    const priceMove = ~~(100 * Math.random() - 50);

    return {
      time: defaultTime + i * timeStep,
      open: 7820.12 + priceMove,
      high: 7828.15 + priceMove,
      low: 7819.3 + priceMove,
      close: 7824.62 + priceMove,
      volume: 10 + 10 * Math.random(),
    };
  });

  batch[EXCHANGE_BASE_INTERVAL_IN_SEC] = candledata;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batch[EXCHANGE_BASE_INTERVAL_IN_SEC].map((elem: any) => {
    result[elem.time] = {};
    result[elem.time][EXCHANGE_BASE_INTERVAL_IN_SEC] = elem;
  });

  if (intervalsTimeInSec.length != 0) {
    for (let i = 0; i < intervalsTimeInSec.length; i++) {
      const interval = intervalsTimeInSec[i];

      batch[interval] = CandleConvert.json(candledata as OHLCV[], EXCHANGE_BASE_INTERVAL_IN_SEC, interval);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      batch[interval].map((elem: any) => {
        result[elem.time][interval] = elem;
      });
    }
  }

  return result as batchedOHLCV;
};
