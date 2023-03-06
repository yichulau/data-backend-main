import moment from "moment";
import { eachSeries } from "async";

import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";

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
  openInterest: number;
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

    _assignValues(allTickers, valueArr, btcSpotValue, ethSpotValue, solSpotValue);

    await _insertExpiryData(conn, valueArr, syncTime);

    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      solOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume,
      solNotionalVolume
    } = _getOIAndNVSum(valueArr);

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
  valueArr: BybitSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number,
  solSpotValue: number
): void {

  tickers.forEach(item => {
    let coinCurrencyID = 0;
    let openInterest = 0;

    const symbol = item.symbol;
    const symbolSplit = symbol.split("-");

    const coinCurrency = <"BTC" | "ETH" | "SOL">symbolSplit[0];
    const callOrPut = <"C" | "P">symbolSplit[3];
    const expiry = moment(symbolSplit[1], "DDMMMYYYY").format(DATEFORMAT);
    const strike = Number(symbolSplit[2]);

    switch (coinCurrency) {
      case "BTC":
        coinCurrencyID = CURRENCY_ID.BTC;
        openInterest = Number(item.openInterest) * btcSpotValue;
        break;

      case "ETH":
        coinCurrencyID = CURRENCY_ID.ETH;
        openInterest = Number(item.openInterest) * ethSpotValue;
        break;

      case "SOL":
        coinCurrencyID = CURRENCY_ID.SOL;
        openInterest = Number(item.openInterest) * solSpotValue;
        break;
    }

    valueArr.push({
      coinCurrencyID,
      callOrPut,
      symbol,
      expiry,
      strike,
      tradingVolume: Number(item.turnover24h),
      openInterest
    });
  });

  return;
}

function _getOIAndNVSum (
  valueArr: BybitSyncValue[]
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
    const OI = item.openInterest;
    const vol = item.tradingVolume;

    if (item.coinCurrencyID === CURRENCY_ID.BTC) {
      btcOpenInterestSum += OI;
      btcNotionalVolume += vol;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
      ethOpenInterestSum += OI;
      ethNotionalVolume += vol;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.SOL) {
      solOpenInterestSum += OI;
      solNotionalVolume += vol;
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