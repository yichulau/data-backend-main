import moment from "moment";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import cache from "@cache/cache";
import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";
import { insertOkexBlockTrade } from "@resource/blockTrade";
import { insert as insertGammaData } from "@resource/gamma";

import {
  getOpenInterest,
  getTicker,
  getBlockTrades,
  getOptionSummary
} from "@service/okex";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type OKEXInstrumentSyncValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  symbol: string,
  expiry: string,
  strike: number,
  tradingVolume: number,
  openInterest?: number,
  lastPrice?: number,
  net?: number,
  bid?: number,
  ask?: number,
  vol?: number,
  iv?: number,
  delta?: number,
  gamma?: number;
};

type OKEXBlockTradeValue = {
  blockTradeID: string,
  instrumentID: string,
  tradeID: bigint,
  tradeTime: number,
  side: "buy" | "sell",
  price: number,
  size: number,
  rawData: string;
};

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  let instValueArr: OKEXInstrumentSyncValue[] = [];
  let btValueArr: OKEXBlockTradeValue[] = [];

  try {
    const tickers = await _getTickers();

    _assignNVValues(tickers, instValueArr, btcSpotValue, ethSpotValue);
    await _assignRawOI(instValueArr);
    await _assignGammaValues(tickers, instValueArr);

    await _insertGammaData(conn, instValueArr, syncTime);
    
    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume
    } = _getOIAndNVSum(instValueArr, btcSpotValue, ethSpotValue);

    await _insertExpiryData(conn, instValueArr, syncTime);

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
): Promise<OKEXTickerResult[]> {

  let btcResult: OKEXTickerResult[];
  let ethResult: OKEXTickerResult[];

  try {
    btcResult = await getTicker({ coinCurrencyPair: "BTC-USD" });
    ethResult = await getTicker({ coinCurrencyPair: "ETH-USD" });
  }
  catch (err) {
    throw err;
  }

  return [...btcResult, ...ethResult];
}

function _assignNVValues (
  tickers: OKEXTickerResult[],
  instValueArr: OKEXInstrumentSyncValue[],
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
      instValueArr.push({
        coinCurrencyID: CURRENCY_ID.BTC,
        callOrPut,
        symbol,
        expiry,
        strike,
        tradingVolume: Number(item.volCcy24h) * btcSpotValue
      });
    }
    else if (coinCurrency === "ETH") {
      instValueArr.push({
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

async function _assignRawOI (
  instValueArr: OKEXInstrumentSyncValue[]
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
    const val = instValueArr.find(i => i.symbol === item.instId);
    if (!val) return;

    val.openInterest = Number(item.oiCcy);
  });

  return;
}

async function _assignGammaValues (
  tickers: OKEXTickerResult[],
  instValueArr: OKEXInstrumentSyncValue[]
): Promise<void> {

  let btcOptSummary: OKEXOptSummaryResult[];
  let ethOptSummary: OKEXOptSummaryResult[];
  let allOptSummary: OKEXOptSummaryResult[];

  try {
    btcOptSummary = await getOptionSummary({ coinCurrencyPair: "BTC-USD" });
    ethOptSummary = await getOptionSummary({ coinCurrencyPair: "ETH-USD" });
  }
  catch (err) {
    throw err;
  }

  allOptSummary = [...btcOptSummary, ...ethOptSummary];

  instValueArr.forEach(item => {
    const ticker = <OKEXTickerResult>tickers.find(i => {
      return i.instId === item.symbol;
    });

    const optSummary = allOptSummary.find(i => {
      return i.instId === item.symbol;
    });

    item.lastPrice = Number(ticker.last);
    item.net = 0;
    item.bid = Number(ticker.bidPx);
    item.ask = Number(ticker.askPx);
    item.vol = Number(ticker.vol24h);
    item.iv = Number(optSummary?.markVol) || 0;
    item.delta = Number(optSummary?.deltaBS) || 0;
    item.gamma = Number(optSummary?.gammaBS) || 0;
  });

  return;
}

function _getOIAndNVSum (
  instValueArr: OKEXInstrumentSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number
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

  instValueArr.forEach(item => {
    if (item.coinCurrencyID === CURRENCY_ID.BTC) {
      item.openInterest = <number>item.openInterest * btcSpotValue;

      btcOpenInterestSum += item.openInterest;
      btcNotionalVolume += item.tradingVolume;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
      item.openInterest = <number>item.openInterest * ethSpotValue;

      ethOpenInterestSum += item.openInterest;
      ethNotionalVolume += item.tradingVolume;
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
  btValueArr: OKEXBlockTradeValue[]
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

async function _insertGammaData (
  conn: DBConnection,
  instValueArr: OKEXInstrumentSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(instValueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: OKEXInstrumentSyncValue): Promise<void> {
    try {
      await insertGammaData(
        conn,
        EXCHANGE_ID.OKEX,
        uuidV4(),
        item.coinCurrencyID,
        timestamp,
        item.expiry,
        item.strike,
        item.callOrPut,
        <number>item.lastPrice,
        <number>item.net,
        <number>item.bid,
        <number>item.ask,
        <number>item.vol,
        <number>item.iv,
        <number>item.delta,
        <number>item.gamma,
        <number>item.openInterest
      );
    }
    catch (err) {
      throw err;
    }

    return;
  }
}

async function _insertExpiryData (
  conn: DBConnection,
  instValueArr: OKEXInstrumentSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(instValueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: OKEXInstrumentSyncValue): Promise<void> {
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
  btValueArr: OKEXBlockTradeValue[]
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

  async function _iterateInsert (item: OKEXBlockTradeValue): Promise<void> {
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
