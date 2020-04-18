export const Utils = {
  minMaxScaler: (data: number[]): number[] => {
    const min = Math.min(...data);
    const max = Math.max(...data);

    const scaledData = data.map(value => {
      return (value - min) / (max - min);
    });

    return scaledData;
  },

  round: (value: number, decimals = 2): number => {
    const coeff = 10 ** decimals;

    return Math.round(value * coeff) / coeff;
  },

  // Twitter time standardizer
  stringtoTimestamp: (string: string): number => {
    return new Date(string).getTime();
  },

  // Get buy_quantity
  buyQuantityBySymbol: (spendableBalance: number, price: number): number => {
    let quantity = 0;

    quantity = Number(spendableBalance) / Number(price);

    return quantity;
  },

  // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  intervalToString: (interval: number): string => {
    let string = '';
    switch (interval) {
      case 60:
        string = '1m';
        break;
      case 180:
        string = '3m';
        break;
      case 300:
        string = '5m';
        break;
      case 900:
        string = '15m';
        break;
      case 1800:
        string = '30m';
        break;
      case 3600:
        string = '1h';
        break;
      case 7200:
        string = '2h';
        break;
      case 14400:
        string = '4h';
        break;
      case 28800:
        string = '8h';
        break;
      case 43200:
        string = '12h';
        break;
      case 86400:
        string = '24h';
        break;
      default:
        string = '1m';
        break;
    }

    return string;
  },

  /*  StockML generic naming  */

  tradesName: (exchange: string, symbol: string): string => {
    const cleanSymbol = symbol
      .replace('/', '')
      .replace('-', '')
      .replace('_', '');

    const name = `${exchange}_${cleanSymbol}_trades`;

    // Lowercase only
    return name.toLowerCase();
  },

  orderbookName: (exchange: string, symbol: string): string => {
    const cleanSymbol = symbol
      .replace('/', '')
      .replace('-', '')
      .replace('_', '');

    const name = `${exchange}_${cleanSymbol}_orderbook`;

    // Lowercase only
    return name.toLowerCase();
  },

  candlestickName: (exchange: string, symbol: string, interval: string | number): string => {
    const cleanSymbol = symbol
      .replace('/', '')
      .replace('-', '')
      .replace('_', '');

    if (typeof interval === 'number') {
      return `${exchange}_${cleanSymbol}_${Utils.intervalToString(interval)}`.toLowerCase();
    }

    // Lowercase only
    return `${exchange}_${cleanSymbol}_${interval}`.toLowerCase();
  },
};
