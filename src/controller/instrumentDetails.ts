import moment from "moment";

import * as binance from "@service/binance";
import * as bitcom from "@service/bitcom";
import * as bybit from "@service/bybit";
import * as deribit from "@service/deribit";
import * as okex from "@service/okex";

import logReqDuration from "helper/logReqDuration";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "common";

type InstrumentDetails = {
  timestamp: number, // unix timestamp in ms
  instrumentName: string,
  underlyingName: string,
  callOrPut: "C" | "P",
  expiry: string,
  strike: number,
  indexPrice: number | null,
  markPrice: number | null,
  vega: number | null,
  theta: number | null,
  rho: number | null,
  gamma: number | null,
  delta: number | null,
  underlyingPrice: number | null,
  price: number | null,
  lastPrice: number | null,
  high24h: number | null,
  low24h: number | null,
  priceChange24h: number | null,
  volume24h: number | null,
  openInterest: number | null,
  markIv: number | null;
};

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let instrumentDetails: InstrumentDetails | null = null;
  let coinCurrency = "";

  const coinCurrencyID = <number>req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  const instrumentName = req.params.instrumentName;

  switch (coinCurrencyID) {
    case CURRENCY_ID.BTC: coinCurrency = "BTC"; break;
    case CURRENCY_ID.ETH: coinCurrency = "ETH"; break;
    case CURRENCY_ID.SOL: coinCurrency = "SOL"; break;
  }

  if (instrumentName.slice(0, 3) !== coinCurrency) {
    return next({
      status: 404
    });
  }

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BINANCE:
        instrumentDetails = await _getBinanceInstrumentDetails(
          <"BTC" | "ETH">coinCurrency,
          <number>req._reqTime,
          instrumentName
        );
        break;

      case EXCHANGE_ID.BITCOM:
        instrumentDetails = await _getBitcomInstrumentDetails(
          <"BTC" | "ETH">coinCurrency,
          <number>req._reqTime,
          instrumentName
        );
        break;

      case EXCHANGE_ID.BYBIT:
        instrumentDetails = await _getBybitInstrumentDetails(
          <"BTC" | "ETH" | "SOL">coinCurrency,
          <number>req._reqTime,
          instrumentName
        );
        break;

      case EXCHANGE_ID.DERIBIT:
        instrumentDetails = await _getDeribitInstrumentDetails(
          <number>req._reqTime,
          instrumentName
        );
        break;

      case EXCHANGE_ID.OKEX:
        instrumentDetails = await _getOkexInstrumentDetails(
          <"BTC" | "ETH">coinCurrency,
          <number>req._reqTime,
          instrumentName
        );
        break;
    }
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  if (instrumentDetails === null) {
    next({
      status: 400
    });
  }
  else {
    res.send(instrumentDetails);
  }

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}

async function _getBinanceInstrumentDetails (
  coinCurrency: "BTC" | "ETH",
  timestamp: number,
  instrumentName: string
): Promise<InstrumentDetails | null> {

  let indexPrice = 0;
  let instResult, oiResult, mpResult;

  try {
    indexPrice = await binance.getIndexPrice({
      coinCurrencyPair: `${coinCurrency}USDT`
    });

    instResult = await binance.getTickers();

    oiResult = await binance.getOpenInterest({
      coinCurrency,
      expiration: instrumentName.slice(4, 10)
    });
  }
  catch (err) {
    throw err;
  }

  const instDetails = instResult.find(i => i.symbol === instrumentName);
  const oiDetails = oiResult.find(i => i.symbol === instrumentName);

  if (!instDetails || !oiDetails) return null;

  try {
    mpResult = await binance.getMarkPrice({ instrumentID: instrumentName });
  }
  catch (err) {
    throw err;
  }

  return {
    timestamp,
    instrumentName,
    underlyingName: instDetails.symbol.slice(0, 10),
    callOrPut: <"C" | "P">instDetails.symbol.slice(-1),
    expiry: moment(instrumentName.slice(4, 10), "YYMMDD").format(DATEFORMAT),
    strike: Number(instDetails.strikePrice),
    indexPrice,
    markPrice: Number(mpResult.markPrice),
    vega: Number(mpResult.vega),
    theta: Number(mpResult.theta),
    rho: null,
    gamma: Number(mpResult.gamma),
    delta: Number(mpResult.delta),
    underlyingPrice: null,
    price: Number(instDetails.askPrice),
    lastPrice: Number(instDetails.lastPrice),
    high24h: Number(instDetails.high),
    low24h: Number(instDetails.low),
    priceChange24h: Number(instDetails.priceChange),
    volume24h: Number(instDetails.volume),
    openInterest: Number(oiDetails.sumOpenInterestUsd),
    markIv: Number(mpResult.markIV)
  };
}

async function _getBitcomInstrumentDetails (
  coinCurrency: "BTC" | "ETH",
  timestamp: number,
  instrumentName: string
): Promise<InstrumentDetails | null> {

  let instResult, tickerResult;

  try {
    instResult = await bitcom.getInstruments({ coinCurrency });

    tickerResult = await bitcom.getTicker({
      instrumentID: instrumentName
    });
  }
  catch (err) {
    throw err;
  }

  const instDetails = instResult.find(i => i.instrument_id === instrumentName);
  if (!instDetails) return null;

  return {
    timestamp,
    instrumentName,
    underlyingName: tickerResult.underlying_name,
    callOrPut: <"C" | "P">instrumentName.slice(-1),
    expiry: moment(instDetails.expiration_at).format(DATEFORMAT),
    strike: Number(instDetails.strike_price),
    indexPrice: Number(tickerResult.index_price),
    markPrice: Number(tickerResult.mark_price),
    vega: Number(tickerResult.vega),
    theta: Number(tickerResult.theta),
    rho: null,
    gamma: Number(tickerResult.gamma),
    delta: Number(tickerResult.delta),
    underlyingPrice: Number(tickerResult.underlying_price),
    price: null,
    lastPrice: Number(tickerResult.last_price),
    high24h: Number(tickerResult.high24h),
    low24h: Number(tickerResult.low24h),
    priceChange24h: Number(tickerResult.price_change24h),
    volume24h: Number(tickerResult.volume24h),
    openInterest: Number(tickerResult.open_interest) * Number(tickerResult.index_price),
    markIv: null
  };
}

async function _getBybitInstrumentDetails (
  coinCurrency: "BTC" | "ETH" | "SOL",
  timestamp: number,
  instrumentName: string
): Promise<InstrumentDetails | null> {

  let tickerResult;

  try {
    tickerResult = await bybit.getTicker({ coinCurrency });
  }
  catch (err) {
    throw err;
  }

  const tickerDetails = tickerResult.find(i => i.symbol === instrumentName);
  if (!tickerDetails) return null;

  const instNameSplit = instrumentName.split("-");
  const underlyingName = instNameSplit[0].concat("-", instNameSplit[1]);
  const expiry = moment(instNameSplit[1], "DDMMMYY").format(DATEFORMAT);
  const strike = Number(instNameSplit[2]);

  return {
    timestamp,
    instrumentName,
    underlyingName,
    callOrPut: <"C" | "P">instrumentName.slice(-1),
    expiry,
    strike,
    indexPrice: Number(tickerDetails.indexPrice),
    markPrice: Number(tickerDetails.markPrice),
    vega: Number(tickerDetails.vega),
    theta: Number(tickerDetails.theta),
    rho: null,
    gamma: Number(tickerDetails.gamma),
    delta: Number(tickerDetails.delta),
    underlyingPrice: Number(tickerDetails.underlyingPrice),
    price: null,
    lastPrice: Number(tickerDetails.lastPrice),
    high24h: Number(tickerDetails.highPrice24h),
    low24h: Number(tickerDetails.lowPrice24h),
    priceChange24h: null,
    volume24h: Number(tickerDetails.volume24h),
    openInterest: Number(tickerDetails.openInterest) * Number(tickerDetails.indexPrice),
    markIv: Number(tickerDetails.markIv)
  };
}

async function _getDeribitInstrumentDetails (
  timestamp: number,
  instrumentName: string
): Promise<InstrumentDetails | null> {

  let tickerResult;

  try {
    tickerResult = await deribit.getTicker({ instrumentName });
  }
  catch (err) {
    throw err;
  }

  const instNameSplit = instrumentName.split("-");
  const expiry = moment(instNameSplit[1], "DDMMMYY").format(DATEFORMAT);
  const strike = Number(instNameSplit[2]);

  return {
    timestamp,
    instrumentName,
    underlyingName: tickerResult.underlying_index,
    callOrPut: <"C" | "P">instrumentName.slice(-1),
    expiry,
    strike,
    indexPrice: tickerResult.index_price,
    markPrice: tickerResult.mark_price,
    vega: tickerResult.greeks.vega,
    theta: tickerResult.greeks.theta,
    rho: tickerResult.greeks.rho,
    gamma: tickerResult.greeks.gamma,
    delta: tickerResult.greeks.delta,
    underlyingPrice: tickerResult.underlying_price,
    price: null,
    lastPrice: tickerResult.last_price,
    high24h: tickerResult.stats.high,
    low24h: tickerResult.stats.low,
    priceChange24h: tickerResult.stats.price_change,
    volume24h: tickerResult.stats.volume,
    openInterest: tickerResult.open_interest,
    markIv: tickerResult.mark_iv
  };
}

async function _getOkexInstrumentDetails (
  coinCurrency: "BTC" | "ETH",
  timestamp: number,
  instrumentName: string
): Promise<InstrumentDetails | null> {

  let indexPrice, tickerResult, oiResult, optSummaryResult, markPrice;
  const coinCurrencyPair = <"BTC-USD" | "ETH-USD">`${coinCurrency}-USD`;

  try {
    indexPrice = await okex.getSpotValue(`${coinCurrencyPair}T`);
    tickerResult = await okex.getTicker({ coinCurrencyPair });
    oiResult = await okex.getOpenInterest({ coinCurrencyPair });
    optSummaryResult = await okex.getOptionSummary({ coinCurrencyPair });
    markPrice = await okex.getMarkPrice({ instrumentID: instrumentName })
  }
  catch (err) {
    throw err;
  }

  const tickerDetails = tickerResult.find(i => i.instId === instrumentName);
  const oiDetails = oiResult.find(i => i.instId === instrumentName);
  const optionDetails = optSummaryResult.find(i => i.instId === instrumentName);

  if (!tickerDetails || !oiDetails || !optionDetails) return null;

  const instNameSplit = instrumentName.split("-");
  const expiry = moment(instNameSplit[2], "YYMMDD").format(DATEFORMAT);
  const strike = Number(instNameSplit[3]);

  return {
    timestamp,
    instrumentName,
    underlyingName: instrumentName.slice(0, 14),
    callOrPut: <"C" | "P">instrumentName.slice(-1),
    expiry,
    strike,
    indexPrice,
    markPrice,
    vega: Number(optionDetails.vega),
    theta: Number(optionDetails.theta),
    rho: null,
    gamma: Number(optionDetails.gamma),
    delta: Number(optionDetails.delta),
    underlyingPrice: null,
    price: Number(tickerDetails.askPx),
    lastPrice: Number(tickerDetails.last) || 0,
    high24h: Number(tickerDetails.high24h) || 0,
    low24h: Number(tickerDetails.low24h) || 0,
    priceChange24h: null,
    volume24h: Number(tickerDetails.volCcy24h) || 0,
    openInterest: Number(oiDetails.oiCcy) * indexPrice,
    markIv: null
  };
}