# TraderCore
[![DeepScan grade](https://deepscan.io/api/teams/6761/projects/8874/branches/145556/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=6761&pid=8874&bid=145556)

TradeCore made for Trading, Signaling and Backtesting Strategies based on datas provided by DataSynchronizer (https://github.com/stockmlbot/DataSynchronizer/).


### Install:

Rename .sample_env -> .env and configure required variables

```
npm install && npm run build && npm start
```

Windows(only):

- Talib will build only with `--vs2015` build tools.

```
npm install --vs2015 --global windows-build-tools
```

### API Endpoints:

#### Tradepairs:

`/all`

Get all available Tradepairs from database.
```
curl --location --request GET 'http://localhost:3100/tradepairs/all'
```

#### Strategy:

`/all`

Get all available Strategy and configuration schema from (https://github.com/stockmlbot/TraderCore/blob/master/src/strategies/index.ts).
```
curl --location --request GET 'http://localhost:3100/strategy/all'
```


#### Backtest:

`/optimize`

Run Backtest optimize process against given Tradepair with various strategy configuration (random generated).
```
curl --location --request POST 'http://localhost:3100/backtest/optimize' \
--data-raw '{
  "exchange": '\''binance'\'',
  "symbol": '\''BTC/USDT'\'',
  "strategy": '\''bb_pure'\'',
  "candleLimit": 3000,
  "numberOfExecution": 30
};'
```

### Additional features:

#### Live strategy evaluation:

It allow to load/update your pre-configured strategies and save trading advices into the database also can be used for Tradebot.

#### Tradebot (experimental):

Interact with Exchanges to execute,update,follow Orders and manage balances.

