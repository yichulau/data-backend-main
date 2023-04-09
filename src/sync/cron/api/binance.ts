import moment from "moment";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import DBConnection from "@database/conn";

import cache from "@cache/cache";
import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";
import { insert as insertGammaData } from "@resource/gamma";

import {
  getTickers,
  getOpenInterest,
  getMarkPrice
} from "@service/binance";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type BinanceSyncValue = {
  existsInCache: boolean,
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  symbol: string,
  expiry: string,
  strike: number,
  tradingVolume: number,
  openInterest?: number,
  lastPrice: number,
  net: number,
  bid: number,
  ask: number,
  iv?: number | null,
  delta?: number | null,
  gamma?: number | null;
};

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  try {
    const tickers = await _getTickers();

    const {
      btcNotionalVolume,
      ethNotionalVolume
    } = _getNotionalVolume(tickers, btcSpotValue, ethSpotValue);

    await _insertNotionalVolume(conn, CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.ETH, syncTime, ethNotionalVolume);

    const valueArr = _getValueArr(tickers);
    await _assignOIAndGammaValues(valueArr);

    await _insertGammaData(conn, valueArr, syncTime, btcSpotValue, ethSpotValue);

    await _insertExpiryData(conn, valueArr, syncTime);

    const {
      btcOpenInterestSum,
      ethOpenInterestSum
    } = _getOpenInterestSum(valueArr);

    await _insertOpenInterest(conn, CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`binance data sync completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("binance data sync error");
    console.error(err);
  }

  return;
}

async function _getTickers (
): Promise<BinanceTickerResult[]> {
  try {
    const result = await getTickers();
    return result;
  }
  catch (err) {
    throw err;
  }
}

function _getNotionalVolume (
  tickers: BinanceTickerResult[],
  btcSpotValue: number,
  ethSpotValue: number
): {
  btcNotionalVolume: number,
  ethNotionalVolume: number;
} {

  let btcNotionalVolume = 0;
  let ethNotionalVolume = 0;

  tickers.forEach(item => {
    if (item.symbol.startsWith("BTC")) {
      btcNotionalVolume += Number(item.volume) * btcSpotValue;
    }
    else if (item.symbol.startsWith("ETH")) {
      ethNotionalVolume += Number(item.volume) * ethSpotValue;
    }
  });

  return { btcNotionalVolume, ethNotionalVolume };
}

function _getValueArr (
  tickers: BinanceTickerResult[]
): BinanceSyncValue[] {

  let valueArr: BinanceSyncValue[] = [];

  tickers.forEach(item => {
    const symbol = item.symbol;
    const ccy = <"BTC" | "ETH">symbol.slice(0, 3);
    const expiry = symbol.slice(4, 10);
    const callOrPut = <"C" | "P">symbol.slice(-1);

    const obj = {
      existsInCache: false,
      callOrPut,
      symbol,
      expiry,
      strike: Number(item.strikePrice),
      tradingVolume: Number(item.volume),
      lastPrice: Number(item.lastPrice),
      net: Number(item.priceChangePercent),
      bid: Number(item.bidPrice),
      ask: Number(item.askPrice)
    };

    if (ccy === "BTC") {
      valueArr.push({
        coinCurrencyID: CURRENCY_ID.BTC,
        ...obj
      });
    }
    else if (ccy === "ETH") {
      valueArr.push({
        coinCurrencyID: CURRENCY_ID.ETH,
        ...obj
      });
    }
  });

  return valueArr;
}

async function _assignOIAndGammaValues (
  valueArr: BinanceSyncValue[]
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterate);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterate (i: BinanceSyncValue): Promise<void> {
    try {
      const existing = await cache.getBinanceSymbol(i.symbol);

      if (existing) {
        i.existsInCache = true;
        i.openInterest = existing.openInterest;
        i.iv = existing.iv;
        i.delta = existing.delta;
        i.gamma = existing.gamma;
        return;
      }
    }
    catch (err) {
      console.log("binance cache error");
      console.error(err);
    }

    try {
      const oiResult = await getOpenInterest({
        coinCurrency: <"BTC" | "ETH">i.symbol.slice(0, 3),
        expiration: i.expiry
      });

      const res = oiResult.find(o => o.symbol === i.symbol);
      i.openInterest = Number(res?.sumOpenInterestUsd) || 0;
    }
    catch (err: any) {
      if (err.response?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await _iterate(i);
      }

      console.log("binance open interest error");
      throw err;
    }

    try {
      const mpResult = await getMarkPrice({ instrumentID: i.symbol });

      i.iv = Number(mpResult.markIV);
      i.delta = Number(mpResult.delta);
      i.gamma = Number(mpResult.gamma);
    }
    catch (err: any) {
      // for unknown reason binance mark price API responds with invalid symbol
      // even though it is listed in ticker API

      // code -1121 = invalid symbol error
      if (err.response?.data?.code === -1121) {
        i.iv = null;
        i.delta = null;
        i.gamma = null;
      }
      else if (err.response?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await _iterate(i);
      }
      else {
        console.log("binance mark price error");
        throw err;
      }
    }

    if (i.existsInCache) return;

    try {
      await cache.setBinanceSymbol({
        symbol: i.symbol,
        openInterest: <number>i.openInterest,
        iv: <number | null>i.iv,
        delta: <number | null>i.delta,
        gamma: <number | null>i.gamma
      });
    }
    catch (err) {
      console.log("binance cache error");
      console.error(err);
    }

    return;
  }
}

function _getOpenInterestSum (
  valueArr: BinanceSyncValue[]
): {
  btcOpenInterestSum: number,
  ethOpenInterestSum: number;
} {

  let btcOpenInterestSum = 0;
  let ethOpenInterestSum = 0;

  valueArr.forEach(item => {
    if (item.coinCurrencyID === CURRENCY_ID.BTC) {
      btcOpenInterestSum += <number>item.openInterest;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
      ethOpenInterestSum += <number>item.openInterest;
    }
  });

  return {
    btcOpenInterestSum,
    ethOpenInterestSum
  };
}

async function _insertNotionalVolume (
  conn: DBConnection,
  coinCurrencyID: number,
  timestamp: number, // unix timestamp in seconds
  value: number
): Promise<void> {

  try {
    await insertVolumeNotional(
      conn,
      coinCurrencyID,
      EXCHANGE_ID.BINANCE,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}

async function _insertGammaData (
  conn: DBConnection,
  valueArr: BinanceSyncValue[],
  timestamp: number,
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: BinanceSyncValue): Promise<void> {
    if (typeof item.iv !== "number") return;

    try {
       if (item.coinCurrencyID === CURRENCY_ID.BTC) {
        await insertGammaData(
          conn,
          EXCHANGE_ID.BINANCE,
          uuidV4(),
          item.coinCurrencyID,
          timestamp,
          moment(item.expiry, "YYMMDD").format(DATEFORMAT),
          item.strike,
          item.callOrPut,
          item.lastPrice,
          item.net,
          item.bid,
          item.ask,
          item.tradingVolume,
          <number>item.iv,
          <number>item.delta,
          <number>item.gamma,
          <number>item.openInterest/btcSpotValue
        );
      }
      else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
        await insertGammaData(
          conn,
          EXCHANGE_ID.BINANCE,
          uuidV4(),
          item.coinCurrencyID,
          timestamp,
          moment(item.expiry, "YYMMDD").format(DATEFORMAT),
          item.strike,
          item.callOrPut,
          item.lastPrice,
          item.net,
          item.bid,
          item.ask,
          item.tradingVolume,
          <number>item.iv,
          <number>item.delta,
          <number>item.gamma,
          <number>item.openInterest/ethSpotValue
        );
      }
    }
    catch (err) {
      throw err;
    }

    return;
  }
}

async function _insertExpiryData (
  conn: DBConnection,
  valueArr: BinanceSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: BinanceSyncValue): Promise<void> {
    try {
      await insertExpiryData(
        conn,
        EXCHANGE_ID.BINANCE,
        item.coinCurrencyID,
        timestamp,
        moment(item.expiry, "YYMMDD").format(DATEFORMAT),
        item.strike,
        item.callOrPut,
        item.tradingVolume,
        <number>item.openInterest
      );
    }
    catch (err) {
      throw err;
    }

    return;
  }
}

async function _insertOpenInterest (
  conn: DBConnection,
  coinCurrencyID: number,
  timestamp: number, // unix timestamp in seconds
  value: number
): Promise<void> {

  try {
    await insertOpenInterest(
      conn,
      coinCurrencyID,
      EXCHANGE_ID.BINANCE,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}
