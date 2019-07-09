"use strict";

const {
  SMA,
  EMA,
  MACD,
  RSI,
  Momentum,
  ROC,
  Acceleration,
  StdDeviation,
  BollingerBands,
  ATR,
  Aroon,
  AccumDist,
  ASI,
  ALMA,
  AO,
  ADX,
  BOP,
  PPO,
  RVGI,
  RVI,
  Stochastic,
  VO,
  OBV,
  PVT,
  MassIndex,
  CMF,
  DPO,
  PC,
  NetVolume,
  KST,
  TSI,
  WR,
  Envelope,
  EOM,
  ChandeMO,
  ChaikinOsc,
  CoppockCurve,
  VWMA,
  VWAP,
  WMA,
  DC,
  StochRSI,
  TRIX,
  EMAVolume
} = require("bfx-hf-indicators"); //Absolute True Range

class TA_buffer {
  constructor() {
    // this.buffer = {};

    this.atrBFX = new ATR([14]); //Absolute True Range					candle OHLC			Period
    this.accelerationBFX = new Acceleration([34]); //Acceleration							candle.close		Period
    this.accumDistBFX = new AccumDist([30]); //Accumulation/Distribution				candle OHLC			Period
    this.asiBFX = new ASI([30]); //Accumulative Swing Index				candle OHLC			Period
    this.almaBFX = new ALMA([3, 0.56, 2]); //20,0.89,6					//Arnoud Legoux Moving Average			candle.close		'Period', 'Offset', 'Sigma'
    this.aroonBFX = new Aroon([48]); //default 14		//Aroon									candle.close		Period
    this.adxBFX = new ADX([14, 14]); //Average Directional Index				candle OHLC			Smoothing, Length
    this.aoBFX = new AO([10]); //Awesome Oscillator					candle OHLC			NO ARGS, LABEL PERIOD ?  !!!!!!!!!!!!!!!!!

    this.bopBFX = new BOP([15]); //Balance of Power						candle OHLC			NO ARGS
    this.bollingerBandsBFX = new BollingerBands([20, 2]); //Bollinger Bands						candle.close		'Period', 'Multiplier'

    this.cmfBFX = new CMF([20]); //Chaikin Money Flow					candle OHLC			Period
    this.chaikinOscBFX = new ChaikinOsc([3, 10]); //Chaikin Oscillator					candle OHLC			'Short Period', 'Long Period'
    this.chandeMOBFX = new ChandeMO([9]); //Chande Momentum Oscillator			candle OHLC			Period
    this.coppockCurveBFX = new CoppockCurve([10, 14, 11]); //Coppock Curve							candle.close		'WMA Length', 'Long RoC Length', 'Short RoC Length'

    this.dpoBFX = new DPO([21]); //Detrended Price Oscillator			candle.close		Period
    this.dcBFX = new DC([20]); //Donchian Channels						candle OHLC			Period

    this.eomBFX = new EOM([10000, 14]); //Ease of Movement						candle OHLC			'Divisor', 'Length'
    this.envelopeBFX = new Envelope([20, 10]); //Envelope								candle.close		'Length', 'Percent'
    this.emaBFX = new EMA([20]); //Exponential Moving Average			candle.close		Period
    this.emaVolumeBFX = new EMAVolume([20]); //EMA Volume							candle OHLC/Volume	Period

    this.kstBFX = new KST([10, 15, 20, 30, 10, 10, 10, 15, 9]); //Know Sure Thing						candle.close		'ROC A Period', 'ROC B Period', 'ROC C Period', 'ROC D Period', 'SMA A Period', 'SMA B Period', 'SMA C Period', 'SMA D Period', 'Signal Period'
    this.macdBFX = new MACD([12, 26, 9]); //MACD									candle.close		'Fast MA Period', 'Slow MA Period', 'Signal MA Period'
    this.massIndexBFX = new MassIndex([10]); //Mass Index							candle OHLC			Period
    this.momentumBFX = new Momentum([10]); //Momentum								candle.close		Period
    this.netVolumeBFX = new NetVolume([20]); //Net Volume							candle OHLC/Volume	NO ARGS
    this.obvBFX = new OBV([20]); //On Balance Volume						candle OHLC/Volume	NO ARGS

    this.pcBFX = new PC([20, 1]); //Price Channel							candle OHLC			'Period', 'Offset'
    this.ppoBFX = new PPO([10, 21]); //Price Oscillator						candle OHLC			'Short Period', 'Long Period'
    this.pvtBFX = new PVT([10]); //Price Volume Trend					candle OHLC			NO ARGS

    this.rsiBFX = new RSI([14]); //RSI									candle.close		Period
    this.rocBFX = new ROC([10]); //Rate of Change						candle.close		Period
    this.rvgiBFX = new RVGI([10]); //Relative Vigor Index					candle OHLC			'rvi', 'signal'
    this.rviBFX = new RVI([10]); //Relative Volatility Index				candle.close		Period

    this.smaBFX = new SMA([20]); //Simple Moving Average					candle.close		Period
    this.stdDeviationBFX = new StdDeviation([20]); //Standard Deviation					candle.close		Period
    this.stochasticBFX = new Stochastic([14, 3, 3]); //Stochastic							candle OHLC			'Period', 'K Smoothing', 'D Smoothing'
    this.stochRsiBFX = new StochRSI([14, 14, 3, 3]); //Stochastic RSI						candle.close		'Length RSI', 'Length Stochastic', 'Stoch Smoothing', 'Signal Smoothing'

    this.trixBFX = new TRIX([18]); //TRIX									candle.close		Period
    this.tsiBFX = new TSI([25, 13, 13]); //True Strength Index					candle.close		'Long Smoothing', 'Short Smoothing', 'Signal Length'

    this.vwapBFX = new VWAP([10]); //VWAP (Volume Weighted Average Price)	candle OHLC/Volume	NO ARGS  <- part of gekko candle data
    this.voBFX = new VO([5, 10]); //Volume Oscillator						candle OHLC/Volume	'Short Period', 'Long Period'
    this.vwmaBFX = new VWMA([20]); //Volume Weighted Moving Average		candle OHLC/Volume	Period

    this.wmaBFX = new WMA([10]); //Weighted Moving Average				candle.close		Period
    this.wrBFX = new WR([14]); //Williams %R							candle OHLC			Period

    /* BUFFER VALUES */

    //BFX-HF-INDICATORS (Results)..................................................
    // this.buffer.atr = []; // .atrBFX.v(); //Absolute True Range
    //console.log("Absolute True Range: "+atrR);									//FINE

    // this.buffer.acceleration = []; // .accelerationBFX.v(); 							//FINE

    // this.buffer.accumDist = []; // .accumDistBFX.v(); //Accumulation/Distribution
    //console.log("Accumulation/Distribution: "+accumDistR);						//FINE

    // this.buffer.asi = []; // .asiBFX.v(); //Accumulative Swing Index
    //console.log("Accumulative Swing Index: "+asiR);								//FINE

    // this.buffer.alma = []; // .almaBFX.v(); //Arnoud Legoux Moving Average
    //console.log("Arnoud Legoux Moving Average: "+almaR);							//FINE

    // this.buffer.aroon = []; // .aroonBFX.v(); //Aroon
    //console.log("Aroon: 'up': "+aroonR['up']+", 'down': "+aroonR['down']);		//FINE

    // this.buffer.adx = []; // .adxBFX.v(); //Average Directional Index
    //console.log("Average Directional Index: "+adxR);								//FINE

    // this.buffer.ao = []; // .aoBFX.v(); //Awesome Oscillator
    //console.log("Awesome Oscillator: "+aoR);										//FINE

    // this.buffer.bop = []; // .bopBFX.v(); //Balance of Power
    //console.log("Balance of Power: "+bopR);										//FINE

    // this.buffer.bBands = []; // .bollingerBandsBFX.v(); //Bollinger Bands
    //console.log("Bollinger Bands (top|middle|bottom): "+bBandsR['top']+"\t"+bBandsR['middle']+"\t"+bBandsR['bottom']);	//FINE

    // this.buffer.cmf = []; // .cmfBFX.v(); //Chaikin Money Flow
    //console.log("Chaikin Money Flow: "+cmfR);										//FINE

    // this.buffer.chaikinOsc = []; // .chaikinOscBFX.v(); //Chaikin Oscillator
    //console.log("Chaikin Oscillator: "+chaikinOscR);								//FINE

    // this.buffer.chandeMO = []; // .chandeMOBFX.v(); //Chande Momentum Oscillator
    //console.log("Chande Momentum Oscillator: "+chandeMOR);						//FINE

    // this.buffer.coppockCurve = []; // .coppockCurveBFX.v(); //Coppock Curve
    //console.log("Coppock Curve: "+coppockCurveR);									//FINE

    // this.buffer.dpo = []; // .dpoBFX.v(); //Detrended Price Oscillator
    //console.log("Detrended Price Oscillator: "+dpoR);					//FINE

    // this.buffer.dc = []; // .dcBFX.v(); //Donchian Channels
    //console.log("Donchian Channels (upper|middle|lower): "+dcR['upper']+"\t"+dcR['middle']+"\t"+dcR['lower']);	//FINE

    // this.buffer.eom = []; // .eomBFX.v(); //Ease of Movement
    //console.log("Ease of Movement: "+eomR);										//FINE

    // this.buffer.envelope = []; // .envelopeBFX.v(); //Envelope
    //console.log("Envelope (upper|basis|lower): "+envelopeR['upper']+"\t"+envelopeR['basis']+"\t"+envelopeR['lower']);	//FINE

    // this.buffer.ema = []; // .emaBFX.v(); //FINE

    // this.buffer.emaVolume = []; // .emaVolumeBFX.v(); //EMA Volume
    //console.log("EMA Volume: "+emaVolumeR);										//FINE

    // this.buffer.kst = []; // .kstBFX.v(); //Know Sure Thing
    //console.log("Know Sure Thing (v|signal): "+kstR['v']+"\t"+kstR['signal']);	//FINE

    // this.buffer.macd = []; // .macdBFX.v(); //MACD
    //console.log("MACD (macd|signal|histogram): "+macdR['macd']+"\t"+macdR['signal']+"\t"+macdR['histogram']);	//FINE

    // this.buffer.massIndex = []; // .massIndexBFX.v(); //Mass Index
    //console.log("Mass Index: "+massIndexR);										//FINE

    // this.buffer.momentum = []; // .momentumBFX.v(); //Momentum
    //console.log("Momentum: "+momentumR);											//FINE

    // this.buffer.netVolume = []; // .netVolumeBFX.v(); //Net Volume
    //console.log("Net Volume: "+netVolumeR);										//FINE

    // this.buffer.obv = []; // .obvBFX.v(); //On Balance Volume
    //console.log("On Balance Volume: "+obvR);									//FINE

    // this.buffer.pc = []; // .pcBFX.v(); //Price Channel
    //console.log("Price Channel (upper|lower|center): "+pcR['upper']+"\t"+pcR['lower']+"\t"+pcR['center']);	//FINE

    // this.buffer.ppo = []; // .ppoBFX.v(); //Price Oscillator
    //console.log("Price Oscillator: "+ppoR);										//FINE

    // this.buffer.pvt = []; // .pvtBFX.v(); //Price Volume Trend
    //console.log("Price Volume Trend: "+pvtR);									//FINE

    // this.buffer.rsi = []; // .rsiBFX.v(); //RSI
    //console.log("RSI: "+rsiR);													//FINE

    // this.buffer.roc = []; // .rocBFX.v(); //Rate of Change
    //console.log("Rate of Change: "+rocR);										//FINE

    // this.buffer.rvgi = []; // .rvgiBFX.v(); //Relative Vigor Index
    //console.log("Relative Vigor Index (rvi|signal): "+rvgiR['rvi']+"\t"+rvgiR['signal']);		//FINE

    // this.buffer.rvi = []; // .rviBFX.v(); //Relative Volatility Index
    //console.log("Relative Volatility Index: "+rviR);							//FINE

    // this.buffer.sma = []; // .smaBFX.v(); //Simple Moving Average
    //console.log("Simple Moving Average: "+smaR);								//FINE

    // this.buffer.stdDeviation = []; // .stdDeviationBFX.v(); //Standard Deviation
    //console.log("Standard Deviation: "+stdDeviationR);							//FINE

    // this.buffer.stochastic = []; // .stochasticBFX.v(); //Stochastic
    //console.log("Stochastic (k|d): "+stochasticR['k']+"\t"+stochasticR['d']);		//FINE

    // this.buffer.stochRsi = []; // .stochRsiBFX.v(); //Stochastic RSI
    //console.log("Stochastic RSI (v|signal): "+stochRsiR['v']+"\t"+stochRsiR['signal']);		//FINE

    // this.buffer.trix = []; // .trixBFX.v(); //TRIX
    //console.log("TRIX: "+trixR);												//FINE

    // this.buffer.tsi = []; // .tsiBFX.v(); //True Strength Index
    //console.log("True Strength Index (v|signal): "+tsiR['v']+"\t"+tsiR['signal']);		//FINE

    // this.buffer.vwap = []; // .vwapBFX.v(); //VWAP (Volume Weighted Average Price)
    //console.log("VWAP (Volume Weighted Average Price): "+vwapR);				//FINE

    // this.buffer.vo = []; // .voBFX.v(); //Volume Oscillator
    //console.log("Volume Oscillator: "+voR);									//FINE

    // this.buffer.vwma = []; // .vwmaBFX.v(); //Volume Weighted Moving Average
    //console.log("Volume Weighted Moving Average: "+vwmaR);						//FINE

    // this.buffer.wma = []; // .wmaBFX.v(); //Weighted Moving Average
    //console.log("Weighted Moving Average: "+wmaR);								//FINE

    // this.buffer.wr = []; // .wrBFX.v(); //Williams %R
  }

  update(candle) {
    let bfx_candle = {
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      vol: candle.volume
    };

    this.atrBFX.add(bfx_candle); //Absolute True Range
    this.accelerationBFX.add(candle.close); //Acceleration
    this.accumDistBFX.add(bfx_candle); //Accumulation/Distribution
    this.asiBFX.add(bfx_candle); //Accumulative Swing Index
    this.almaBFX.add(candle.close); //Arnoud Legoux Moving Average
    this.aroonBFX.add(candle.close); //Aroon
    this.adxBFX.add(bfx_candle); //Average Directional Index
    this.aoBFX.add(bfx_candle); //Awesome Oscillator

    this.bopBFX.add(bfx_candle); //Balance of Power
    this.bollingerBandsBFX.add(candle.close); //Bollinger Bands

    this.cmfBFX.add(bfx_candle); //Chaikin Money Flow
    this.chaikinOscBFX.add(bfx_candle); //Chaikin Oscillator
    this.chandeMOBFX.add(bfx_candle); //Chande Momentum Oscillator
    this.coppockCurveBFX.add(candle.close); //Coppock Curve

    this.dpoBFX.add(candle.close); //Detrended Price Oscillator
    this.dcBFX.add(bfx_candle); //Donchian Channels

    this.eomBFX.add(bfx_candle); //Ease of Movement
    this.envelopeBFX.add(candle.close); //Envelope
    this.emaBFX.add(candle.close); //Exponential Moving Average
    this.emaVolumeBFX.add(bfx_candle); //EMA Volume

    this.kstBFX.add(candle.close); //Know Sure Thing
    this.macdBFX.add(candle.close); //MACD
    this.massIndexBFX.add(bfx_candle); //Mass Index
    this.momentumBFX.add(candle.close); //Momentum
    this.netVolumeBFX.add(bfx_candle); //Net Volume
    this.obvBFX.add(bfx_candle); //On Balance Volume

    this.pcBFX.add(bfx_candle); //Price Channel
    this.ppoBFX.add(candle.close); //Price Oscillator
    this.pvtBFX.add(bfx_candle); //Price Volume Trend

    this.rsiBFX.add(candle.close); //RSI
    this.rocBFX.add(candle.close); //Rate of Change
    this.rvgiBFX.add(bfx_candle); //Relative Vigor Index
    this.rviBFX.add(candle.close); //Relative Volatility Index

    this.smaBFX.add(candle.close); //Simple Moving Average
    this.stdDeviationBFX.add(candle.close); //Standard Deviation
    this.stochasticBFX.add(bfx_candle); //Stochastic
    this.stochRsiBFX.add(candle.close); //Stochastic RSI

    this.trixBFX.add(candle.close); //TRIX
    this.tsiBFX.add(candle.close); //True Strength Index

    this.vwapBFX.add(bfx_candle); //VWAP (Volume Weighted Average Price)
    this.voBFX.add(bfx_candle); //Volume Oscillator
    this.vwmaBFX.add(bfx_candle); //Volume Weighted Moving Average

    this.wmaBFX.add(candle.close); //Weighted Moving Average
    this.wrBFX.add(bfx_candle); //Williams %R

    this.sync_result();
  }

  sync_result() {
    this.atr = this.atrBFX.v();
    // this.buffer.atr.push(this.atr); //Absolute True Range

    this.acceleration = this.accelerationBFX.v();
    // this.buffer.acceleration.push(this.acceleration); //Acceleration

    this.accumDist = this.accumDistBFX.v();
    // this.buffer.accumDist.push(this.accumDist); //Accumulation/Distribution

    this.asi = this.asiBFX.v();
    // this.buffer.asi.push(this.asi); //Accumulative Swing Index

    this.alma = this.almaBFX.v();
    // this.buffer.alma.push(this.alma); //Arnoud Legoux Moving Average

    this.aroon = this.aroonBFX.v();
    // this.buffer.aroon.push(this.aroon); //Aroon

    this.adx = this.adxBFX.v();
    // this.buffer.adx.push(this.adx); //Average Directional Index

    this.ao = this.aoBFX.v();
    // this.buffer.ao.push(this.ao); //Awesome Oscillator

    this.bop = this.bopBFX.v();
    // this.buffer.bop.push(this.bopBFX.v()); //Balance of Power

    this.bBands = this.bollingerBandsBFX.v();
    // this.buffer.bBands.push(this.bollingerBandsBFX.v()); //Bollinger Bands

    this.cmf = this.cmfBFX.v();
    // this.buffer.cmf.push(this.cmfBFX.v()); //Chaikin Money Flow

    this.chaikinOsc = this.chaikinOscBFX.v();
    // this.buffer.chaikinOsc.push(this.chaikinOscBFX.v()); //Chaikin Oscillator

    this.chandeMO = this.chandeMOBFX.v();
    // this.buffer.chandeMO.push(this.chandeMOBFX.v()); //Chande Momentum Oscillator

    this.coppockCurve = this.coppockCurveBFX.v();
    // this.buffer.coppockCurve.push(this.coppockCurveBFX.v()); //Coppock Curve

    this.dpo = this.dpoBFX.v();
    // this.buffer.dpo.push(this.dpoBFX.v()); //Detrended Price Oscillator

    this.dc = this.dcBFX.v();
    // this.buffer.dc.push(this.dcBFX.v()); //Donchian Channels

    this.eom = this.eomBFX.v();
    // this.buffer.eom.push(this.eomBFX.v()); //Ease of Movement

    this.envelope = this.envelopeBFX.v();
    // this.buffer.envelope.push(this.envelopeBFX.v()); //Envelope

    this.ema = this.emaBFX.v();
    // this.buffer.ema.push(this.emaBFX.v()); //FINE

    this.emaVolume = this.emaVolumeBFX.v();
    // this.buffer.emaVolume.push(this.emaVolumeBFX.v()); //EMA Volume

    this.kst = this.kstBFX.v();
    // this.buffer.kst.push(this.kstBFX.v()); //Know Sure Thing

    this.macd = this.macdBFX.v();
    // this.buffer.macd.push(this.macdBFX.v()); //MACD

    this.massIndex = this.massIndexBFX.v();
    // this.buffer.massIndex.push(this.massIndexBFX.v()); //Mass Index

    this.momentum = this.momentumBFX.v();
    // this.buffer.momentum.push(this.momentumBFX.v()); //Momentum

    this.netVolume = this.netVolumeBFX.v();
    // this.buffer.netVolume.push(this.netVolumeBFX.v()); //Net Volume

    this.obv = this.obvBFX.v();
    // this.buffer.obv.push(this.obvBFX.v()); //On Balance Volume

    this.pc = this.pcBFX.v();
    // this.buffer.pc.push(this.pcBFX.v()); //Price Channel

    this.ppo = this.ppoBFX.v();
    // this.buffer.ppo.push(this.ppoBFX.v()); //Price Oscillator

    this.pvt = this.pvtBFX.v();
    // this.buffer.pvt.push(this.pvtBFX.v()); //Price Volume Trend

    this.rsi = this.rsiBFX.v();
    // this.buffer.rsi.push(this.rsi); //RSI

    this.roc = this.rocBFX.v();
    // this.buffer.roc.push(this.rocBFX.v()); //Rate of Change

    this.rvgi = this.rvgiBFX.v();
    // this.buffer.rvgi.push(this.rvgiBFX.v()); //Relative Vigor Index

    this.rvi = this.rviBFX.v();
    // this.buffer.rvi.push(this.rviBFX.v()); //Relative Volatility Index

    this.sma = this.smaBFX.v();
    // this.buffer.sma.push(this.smaBFX.v()); //Simple Moving Average

    this.stdDeviation = this.stdDeviationBFX.v();
    // this.buffer.stdDeviation.push(this.stdDeviationBFX.v()); //Standard Deviation

    this.stochastic = this.stochasticBFX.v();
    // this.buffer.stochastic.push(this.stochasticBFX.v()); //Stochastic

    this.stochRsi = this.stochRsiBFX.v();
    // this.buffer.stochRsi.push(this.stochRsiBFX.v()); //Stochastic RSI

    this.trix = this.trixBFX.v();
    // this.buffer.trix.push(this.trixBFX.v()); //TRIX

    this.tsi = this.tsiBFX.v();
    // this.buffer.tsi.push(this.tsiBFX.v()); //True Strength Index

    this.vwap = this.vwapBFX.v();
    // this.buffer.vwap.push(this.vwapBFX.v()); //VWAP (Volume Weighted Average Price)

    this.vo = this.voBFX.v();
    // this.buffer.vo.push(this.voBFX.v()); //Volume Oscillator

    this.vwma = this.vwmaBFX.v();
    // this.buffer.vwma.push(this.vwmaBFX.v()); //Volume Weighted Moving Average

    this.wma = this.wmaBFX.v();
    // this.buffer.wma.push(this.wmaBFX.v()); //Weighted Moving Average

    this.wr = this.wrBFX.v();
    // this.buffer.wr.push(this.wrBFX.v()); //Williams %R
  }
}

module.exports = TA_buffer;
