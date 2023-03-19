import moment from "moment";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import cache from "@cache/cache";
import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";
import { insertOkexBlockTrade } from "@resource/blockTrade";

import {
  getOpenInterest,
  getTicker,
  getBlockTrades
} from "@service/okex";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type OkexOIAndNVValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  symbol: string,
  expiry: string,
  strike: number,
  tradingVolume: number,
  openInterest?: number;
};

type OkexBlockTradeValue = {
  blockTradeID: string,
  instrumentID: string,
  tradeID: bigint,
  tradeTime: number,
  side: "buy" | "sell",
  price: number,
  size: number,
  rawData: string
};

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  let oiAndNvValueArr: OkexOIAndNVValue[] = [];
  let btValueArr: OkexBlockTradeValue[] = [];

  try {
    const btcTickers = await _getTickers("BTC-USD");
    const ethTickers = await _getTickers("ETH-USD");
    const allTickers = [...btcTickers, ...ethTickers];

    _assignNVValues(allTickers, oiAndNvValueArr, btcSpotValue, ethSpotValue);
    await _assignOI(oiAndNvValueArr, btcSpotValue, ethSpotValue);

    await _insertExpiryData(conn, oiAndNvValueArr, syncTime);

    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume
    } = _getOIAndNVSum(oiAndNvValueArr);

    await _insertNotionalVolume(conn, CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.ETH, syncTime, ethNotionalVolume);

    await _insertOpenInterest(conn, CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);

    const blockTrades = await _getBlockTrades();
    _assignBTValues(blockTrades, btValueArr);

    await _insertBlockTradeData(conn, btValueArr);

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

function _assignNVValues (
  tickers: OKEXTickerResult[],
  oiAndNvValueArr: OkexOIAndNVValue[],
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
      oiAndNvValueArr.push({
        coinCurrencyID: CURRENCY_ID.BTC,
        callOrPut,
        symbol,
        expiry,
        strike,
        tradingVolume: Number(item.volCcy24h) * btcSpotValue
      });
    }
    else if (coinCurrency === "ETH") {
      oiAndNvValueArr.push({
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
  oiAndNvValueArr: OkexOIAndNVValue[],
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
    const value = oiAndNvValueArr.find(i => {
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
  oiAndNvValueArr: OkexOIAndNVValue[]
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

  oiAndNvValueArr.forEach(item => {
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

async function _getBlockTrades (
): Promise<OKEXBlockTradeResult[]> {

  try {
    const lastBlockTradeID = await cache.getOkexLastBlockTradeID();

    const result = await getBlockTrades({
      beginID: lastBlockTradeID
    });

    return result;
  }
  catch (err) {
    throw err;
  }
}

function _assignBTValues (
  blockTrades: OKEXBlockTradeResult[],
  btValueArr: OkexBlockTradeValue[]
): void {

  blockTrades.forEach(blockTrade => {
    blockTrade.legs.forEach(leg => {
      btValueArr.push({
        blockTradeID: blockTrade.blockTdId,
        instrumentID: leg.instId,
        tradeID: BigInt(leg.tradeId),
        tradeTime: Math.floor(Number(blockTrade.cTime) / 1000),
        side: leg.side,
        price: Number(leg.px),
        size: Number(leg.sz),
        rawData: JSON.stringify(blockTrade)
      });
    });
  });

  return;
}

async function _insertExpiryData (
  conn: DBConnection,
  oiAndNvValueArr: OkexOIAndNVValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(oiAndNvValueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: OkexOIAndNVValue): Promise<void> {
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

async function _insertBlockTradeData (
  conn: DBConnection,
  btValueArr: OkexBlockTradeValue[]
): Promise<void> {

  if (btValueArr.length === 0) return;

  let lastBlockTradeID = "0";

  try {
    await eachSeries(btValueArr, _iterateInsert);

    btValueArr.forEach(item => {
      if (item.blockTradeID > lastBlockTradeID) {
        lastBlockTradeID = item.blockTradeID;
      }
    });

    await cache.setOkexLastBlockTradeID(lastBlockTradeID);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: OkexBlockTradeValue): Promise<void> {
    const coinCurrency = <"BTC" | "ETH">item.instrumentID.substring(0, 3);
    const coinCurrencyID = CURRENCY_ID[coinCurrency];

    try {
      await insertOkexBlockTrade(
        conn,
        uuidV4(),
        coinCurrencyID,
        item.blockTradeID,
        item.instrumentID,
        item.tradeID,
        item.tradeTime,
        item.side,
        item.price,
        item.size,
        item.rawData
      );
    }
    catch (err) {
      throw err;
    }

    return;
  }
}