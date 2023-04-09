import moment from "moment";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";
import { insert as insertGammaData } from "@resource/gamma";

import { getTicker } from "@service/bybit";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type BybitSyncValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  symbol: string,
  expiry: string,
  strike: number,
  tradingVolume: number,
  openInterest: number,
  lastPrice: number,
  net: number,
  bid: number,
  ask: number,
  vol: number,
  iv: number,
  delta: number,
  gamma: number;
};

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number,
  solSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  let valueArr: BybitSyncValue[] = [];

  try {
    const btcTickers = await _getTickers("BTC");
    const ethTickers = await _getTickers("ETH");
    const solTickers = await _getTickers("SOL");
    const allTickers = [...btcTickers, ...ethTickers, ...solTickers];

    _assignValues(allTickers, valueArr);

    await _insertGammaData(conn, valueArr, syncTime);
    
    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      solOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume,
      solNotionalVolume
    } = _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue, solSpotValue);
    
    await _insertExpiryData(conn, valueArr, syncTime);

    await _insertNotionalVolume(conn, CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.SOL, syncTime, solNotionalVolume);

    await _insertOpenInterest(conn, CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.SOL, syncTime, solOpenInterestSum);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`bybit data sync completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("bybit data sync error");
    console.error(err);
  }

  return;
}

async function _getTickers (
  coinCurrency: "BTC" | "ETH" | "SOL"
): Promise<BybitTickerResult[]> {

  try {
    const result = await getTicker({ coinCurrency });
    return result;
  }
  catch (err) {
    throw err;
  }
}

function _assignValues (
  tickers: BybitTickerResult[],
  valueArr: BybitSyncValue[]
): void {

  tickers.forEach(item => {
    let coinCurrencyID = 0;

    const symbol = item.symbol;
    const symbolSplit = symbol.split("-");

    const callOrPut = <"C" | "P">symbolSplit[3];
    const expiry = moment(symbolSplit[1], "DDMMMYYYY").format(DATEFORMAT);
    const strike = Number(symbolSplit[2]);

    switch (item.symbol.substring(0, 3)) {
      case "BTC": coinCurrencyID = CURRENCY_ID.BTC; break;
      case "ETH": coinCurrencyID = CURRENCY_ID.ETH; break;
      case "SOL": coinCurrencyID = CURRENCY_ID.SOL; break;
    }

    valueArr.push({
      coinCurrencyID,
      callOrPut,
      symbol,
      expiry,
      strike,
      tradingVolume: Number(item.turnover24h),
      openInterest: Number(item.openInterest),
      lastPrice: Number(item.lastPrice),
      net: Number(item.change24h),
      bid: Number(item.bid1Price),
      ask: Number(item.ask1Price),
      vol: Number(item.volume24h),
      iv: Number(item.markIv),
      delta: Number(item.delta),
      gamma: Number(item.gamma)
    });
  });

  return;
}

function _getOIAndNVSum (
  valueArr: BybitSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number,
  solSpotValue: number
): {
  btcOpenInterestSum: number,
  ethOpenInterestSum: number,
  solOpenInterestSum: number,
  btcNotionalVolume: number,
  ethNotionalVolume: number,
  solNotionalVolume: number;
} {

  let btcOpenInterestSum = 0;
  let ethOpenInterestSum = 0;
  let solOpenInterestSum = 0;
  let btcNotionalVolume = 0;
  let ethNotionalVolume = 0;
  let solNotionalVolume = 0;

  valueArr.forEach(item => {
    if (item.coinCurrencyID === CURRENCY_ID.BTC) {
      item.openInterest *= btcSpotValue;

      btcOpenInterestSum += item.openInterest;
      btcNotionalVolume += item.tradingVolume;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
      item.openInterest *= ethSpotValue;

      ethOpenInterestSum += item.openInterest;
      ethNotionalVolume += item.tradingVolume;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.SOL) {
      item.openInterest *= solSpotValue;

      solOpenInterestSum += item.openInterest;
      solNotionalVolume += item.tradingVolume;
    }
  });

  return {
    btcOpenInterestSum,
    ethOpenInterestSum,
    solOpenInterestSum,
    btcNotionalVolume,
    ethNotionalVolume,
    solNotionalVolume
  };
}

async function _insertExpiryData (
  conn: DBConnection,
  valueArr: BybitSyncValue[],
  timestamp: number // unix timestamp in seconds
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: BybitSyncValue): Promise<void> {
    try {
      await insertExpiryData(
        conn,
        EXCHANGE_ID.BYBIT,
        item.coinCurrencyID,
        timestamp,
        item.expiry,
        item.strike,
        item.callOrPut,
        item.tradingVolume,
        item.openInterest
      );
    }
    catch (err) {
      throw err;
    }

    return;
  }
}

async function _insertGammaData (
  conn: DBConnection,
  valueArr: BybitSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: BybitSyncValue): Promise<void> {
    try {
      await insertGammaData(
        conn,
        EXCHANGE_ID.BYBIT,
        uuidV4(),
        item.coinCurrencyID,
        timestamp,
        item.expiry,
        item.strike,
        item.callOrPut,
        item.lastPrice,
        item.net,
        item.bid,
        item.ask,
        item.vol,
        item.iv,
        item.delta,
        item.gamma,
        item.openInterest
      );
    }
    catch (err) {
      throw err;
    }

    return;
  }
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
      EXCHANGE_ID.BYBIT,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}

async function _insertOpenInterest (
  conn: DBConnection,
  coinCurrencyID: number,
  timestamp: number, // unix timeestamp in seconds
  value: number
): Promise<void> {

  try {
    await insertOpenInterest(
      conn,
      coinCurrencyID,
      EXCHANGE_ID.BYBIT,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}