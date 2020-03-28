# TraderCore
[![DeepScan grade](https://deepscan.io/api/teams/6761/projects/8874/branches/145556/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=6761&pid=8874&bid=145556)

This application made for DataSynchronizer (https://github.com/stockmlbot/DataSynchronizer/) to utilize and process the collected exchange datas and provide various endpoints.
#

**Tradebot:**

It can interact with Exchanges to execute,update,follow Orders and manage balances.

**Live emulator:**

It allow to load/update your pre-configured strategies, it can give advices to Tradebot.

**Backtest emulator:**

This reffer to execute backtest, monte-carlo analysis (auto optimize strategies), this can be CPU intense.

**HTTP API:**

Every module has HTTP API end-point.


#
**Install:**
- Edit configuration files

```
npm install && npm run build && npm start
```

Windows(only):

- Talib will build only with `--vs2015` build tools.

```
npm install --vs2015 --global windows-build-tools
```


