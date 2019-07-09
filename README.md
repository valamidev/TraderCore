# TraderCore

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
