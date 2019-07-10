# TraderCore

This package is the main package of the StockML, it has 4 module + optional HTTP API end-point. Lets see what modules can do.

**Tradebot:**
It can interact with Exchanges to execute,update,follow Orders and manage balances.

**Live emulator:**
It allow to load/hot load/update your pre configured strategies, it can give advices to Tradebot.

**Backtest emulator:**
This reffer to execute backtest, monte-carlo analysis (auto optimize strategies), this can be CPU intense.

**Evaluator:**
It is an automatisation for Backtest emulator, it can run every 12hour (default settings) and check every strategi on every tradepairs. This can be very much CPU intense.

**+1 HTTP API:**
Every module has HTTP API end-point for manual controlling.


Install:
```
- npm install
```

Settings:
- Rename .sample_env to .env
```
# MySQL Database Config 
#
#
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASS=pass
MYSQL_DB=stockml

# Loglevel verbose,info
log_level = info

# Application settings
#
# On / Off
# Handle Trader orders based on Trade Advices
traderbot = 1 
# Update Trader Advices
live_emulator = 0
# Allow to Run Backtests
backtest_emulator = 1
# Automated Evaluator run in every 12 hours
evaluator = 0

#Binance
#
#
BINANCE_APIKEY= 
BINANCE_APISECRET= 


#HTTP API
# Need for Client Access
http_api = 1
http_port = 3001
```
