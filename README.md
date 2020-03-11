# TraderCore

This package is the main package of the StockML, it has 4 module + optional HTTP API end-point. Lets see what modules can do.

**Discord Chat:**

- Join our chat: https://discord.gg/GsAdRP8

**Tradebot:**

It can interact with Exchanges to execute,update,follow Orders and manage balances.

**Live emulator:**

It allow to load/update your pre configured strategies, it can give advices to Tradebot.

**Backtest emulator:**

This reffer to execute backtest, monte-carlo analysis (auto optimize strategies), this can be CPU intense.

**Evaluator:**

It is an automatisation for Backtest emulator, it can run every 12hour (default settings) and check every strategi on every tradePairs. This can be very much CPU intense.

**+1 HTTP API:**

Every module has HTTP API end-point for manual controlling.

**Install:**

```
npm install
```

Windows(Only):

- Talib will build only with `--vs2015` build tools.

```
npm install --vs2015 --global windows-build-tools
```

Edit \_sample configuration files
