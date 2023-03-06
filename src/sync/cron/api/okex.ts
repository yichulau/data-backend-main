import moment from "moment";
import { eachSeries } from "async";

import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";

import {
  getOpenInterest,
  getTicker
} from "@service/okex";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type OkexSyncValue = {
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

  let valueArr: OkexSyncValue[] = [];

  try {
    const btcTickers = await _getTickers("BTC-USD");
    const ethTickers = await _getTickers("ETH-USD");
    const allTickers = [...btcTickers, ...ethTickers];

    _assignValues(allTickers, valueArr, btcSpotValue, ethSpotValue);
    await _assignOI(valueArr, btcSpotValue, ethSpotValue);

    await _insertExpiryData(conn, valueArr, syncTime);

    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume
    } = _getOIAndNVSum(valueArr);

    await _insertNotionalVolume(conn, CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.ETH, syncTime, ethNotionalVolume);

    await _insertOpenInterest(conn, CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`okex data sync completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("okex data sync error");
    console.error(err);
  }

  return;
}

async function _getTickers (
  coinCurrencyPair: "BTC-USD" | "ETH-USD"
): Promise<OKEXTickerResult[]> {

  try {
    const result = await getTicker({ coinCurrencyPair });
    return result;
  }
  catch (err) {
    throw err;
  }
}

function _assignValues (
  tickers: OKEXTickerResult[],
  valueArr: OkexSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number
): void {

  tickers.forEach(item => {
    const symbol = item.instId;
    const symbolSplit = symbol.split("-");

    const coinCurrency = <"BTC" | "ETH" | "SOL">symbolSplit[0];
    const callOrPut = <"C" | "P">symbolSplit[4];
    const expiry = moment(symbolSplit[2], "YYMMDD").format(DATEFORMAT);
    const strike = Number(symbolSplit[3]);

    if (coinCurrency === "BTC") {
      valueArr.push({
        coinCurrencyID: CURRENCY_ID.BTC,
        callOrPut,
        symbol,
        expiry,
        strike,
        tradingVolume: Number(item.volCcy24h) * btcSpotValue
      });
    }
    else if (coinCurrency === "ETH") {
      valueArr.push({
        coinCurrencyID: CURRENCY_ID.ETH,
        callOrPut,
        symbol,
        expiry,
        strike,
        tradingVolume: Number(item.volCcy24h) * ethSpotValue
      });
    }
  });

  return;
}

async function _assignOI (
  valueArr: OkexSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  let btcResult: OKEXOIResult[] = [];
  let ethResult: OKEXOIResult[] = [];
  let combinedResults: OKEXOIResult[] = [];

  try {
    btcResult = await getOpenInterest({ coinCurrencyPair: "BTC-USD" });
    ethResult = await getOpenInterest({ coinCurrencyPair: "ETH-USD" });
  }
  catch (err) {
    throw err;
  }

  combinedResults = [...btcResult, ...ethResult];

  combinedResults.forEach(item => {
    const value = valueArr.find(i => {
      return i.symbol === item.instId;
    });

    if (!value) return;

    const coinCurrency = <"BTC" | "ETH">item.instId.slice(0, 3);

    if (coinCurrency === "BTC") {
      value.openInterest = Number(item.oiCcy) * btcSpotValue;
    }
    else {
      value.openInterest = Number(item.oiCcy) * ethSpotValue;
    }
  });

  return;
}

function _getOIAndNVSum (
  valueArr: OkexSyncValue[]
): {
  btcOpenInterestSum: number,
  ethOpenInterestSum: number,
  btcNotionalVolume: number,
  ethNotionalVolume: number;
} {

  let btcOpenInterestSum = 0;
  let ethOpenInterestSum = 0;
  let btcNotionalVolume = 0;
  let ethNotionalVolume = 0;

  valueArr.forEach(item => {
    const OI = <number>item.openInterest;
    const vol = <number>item.tradingVolume;

    if (item.coinCurrencyID === CURRENCY_ID.BTC) {
      btcOpenInterestSum += OI;
      btcNotionalVolume += vol;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
      ethOpenInterestSum += OI;
      ethNotionalVolume += vol;
    }
  });

  return {
    btcOpenInterestSum,
    ethOpenInterestSum,
    btcNotionalVolume,
    ethNotionalVolume
  };
}

async function _insertExpiryData (
  conn: DBConnection,
  valueArr: OkexSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: OkexSyncValue): Promise<void> {
    try {
      await insertExpiryData(
        conn,
        EXCHANGE_ID.OKEX,
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
      EXCHANGE_ID.OKEX,
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
  timestamp: number, // unix timestamp in seconds
  value: number
): Promise<void> {

  try {
    await insertOpenInterest(
      conn,
      coinCurrencyID,
      EXCHANGE_ID.OKEX,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}