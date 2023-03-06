import { eachSeries } from "async";

import DBConnection from "@database/conn";

import cache from "@cache/cache";
import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";

import {
  getTickers,
  getOpenInterest
} from "@service/binance";

import {
  CURRENCY_ID,
  EXCHANGE_ID
} from "../../../common";

type BinanceSyncValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  symbol: string,
  expiry: string,
  strike: number,
  tradingVolume: number,
  openInterest?: number;
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
    await _assignOpenInterestValues(valueArr);

    await _insertTradingVolumeData(conn, valueArr, syncTime);

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
    const ccy = <"BTC" | "ETH" | "BNB">symbol.slice(0, 3);
    const expiry = symbol.slice(4, 10);
    const callOrPut = <"C" | "P">symbol.slice(-1);

    if (ccy === "BTC") {
      valueArr.push({
        coinCurrencyID: CURRENCY_ID.BTC,
        callOrPut,
        symbol,
        expiry,
        strike: Number(item.strikePrice),
        tradingVolume: Number(item.volume)
      });
    }
    else if (ccy === "ETH") {
      valueArr.push({
        coinCurrencyID: CURRENCY_ID.ETH,
        callOrPut,
        symbol,
        expiry,
        strike: Number(item.strikePrice),
        tradingVolume: Number(item.volume)
      });
    }
  });

  return valueArr;
}

async function _assignOpenInterestValues (
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
        i.openInterest = existing.openInterest;
        return;
      }

      const coinCurrency = <"BTC" | "ETH">i.symbol.slice(0, 3);

      const result = await getOpenInterest({
        coinCurrency,
        expiration: i.expiry
      });

      await eachSeries(result,
        async (item) => {
          const openInterest = Number(item.sumOpenInterestUsd);
          i.openInterest = openInterest;

          try {
            await cache.setBinanceSymbol({
              symbol: i.symbol,
              openInterest
            });
          }
          catch (err) {
            throw err;
          }
        }
      );

      return;
    }
    catch (err) {
      throw err;
    }
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

async function _insertTradingVolumeData (
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
        item.expiry,
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