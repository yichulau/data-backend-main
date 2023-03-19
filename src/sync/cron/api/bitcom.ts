import moment from "moment";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import cache from "@cache/cache";
import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";
import { insertBitcomBlockTrade } from "@resource/blockTrade";

import {
  getInstruments,
  getTicker,
  getMarketTrades
} from "@service/bitcom";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type BitcomSyncValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  instrumentID: string,
  expiry: string,
  strike: number,
  tradingVolume?: number,
  openInterest?: number;
};

type BitcomBlockTradeValue = {
  blockTradeID: bigint,
  instrumentID: string,
  tradeID: bigint,
  tradeTime: number,
  side: "buy" | "sell",
  price: number,
  underlyingPrice: number,
  size: number,
  sigma: number,
  rawData: string;
};

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  let valueArr: BitcomSyncValue[] = [];
  let btValueArr: BitcomBlockTradeValue[] = [];

  try {
    const btcInstruments = await _getInstruments("BTC");
    const ethInstruments = await _getInstruments("ETH");
    const allInstruments = [...btcInstruments, ...ethInstruments];

    _assignStrikeAndExpiry(allInstruments, valueArr);
    await _assignOIAndVolume(valueArr, btcSpotValue, ethSpotValue);

    await _insertExpiryData(conn, valueArr, syncTime);

    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume
    } = _getOIAndNVSum(valueArr);

    const marketTrades = await _getMarketTrades();
    _assignBTValues(marketTrades, btValueArr);

    await _insertBlockTradeData(conn, btValueArr);

    await _insertNotionalVolume(conn, CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.ETH, syncTime, ethNotionalVolume);

    await _insertOpenInterest(conn, CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`bit.com data sync completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("bit.com data sync error");
    console.error(err);
  }

  return;
}

async function _getInstruments (
  coinCurrency: "BTC" | "ETH"
): Promise<BitcomInstrumentResult[]> {

  try {
    const result = await getInstruments({ coinCurrency });
    return result;
  }
  catch (err) {
    throw err;
  }
}

function _assignStrikeAndExpiry (
  instruments: BitcomInstrumentResult[],
  valueArr: BitcomSyncValue[]
): void {

  instruments.forEach(item => {
    let coinCurrencyID = 0;
    const callOrPut = <"C" | "P">item.instrument_id.slice(-1);
    const expiry = moment(item.expiration_at).format(DATEFORMAT);

    if (item.base_currency === "BTC") {
      coinCurrencyID = CURRENCY_ID.BTC;
    }
    else if (item.base_currency === "ETH") {
      coinCurrencyID = CURRENCY_ID.ETH;
    }

    valueArr.push({
      coinCurrencyID,
      callOrPut,
      instrumentID: item.instrument_id,
      expiry,
      strike: Number(item.strike_price)
    });
  });
}

async function _assignOIAndVolume (
  valueArr: BitcomSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterate);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterate (i: BitcomSyncValue): Promise<void> {
    let tickerResult, openInterest, tradingVolume;
    const instrumentID = i.instrumentID;

    try {
      const existing = await cache.getBitcomInstrument(instrumentID);

      if (existing) {
        i.openInterest = existing.openInterest;
        i.tradingVolume = existing.tradingVolume;
        return;
      }
    }
    catch (err) {
      console.log("cache error");
      console.error(err);
    }

    do {
      try {
        tickerResult = await getTicker({ instrumentID });
      }
      catch (err: any) {
        if (err.response.status !== 429) {
          throw err;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    while (typeof tickerResult === "undefined");

    if (i.coinCurrencyID === CURRENCY_ID.BTC) {
      openInterest = Number(tickerResult.open_interest) * btcSpotValue;
      tradingVolume = Number(tickerResult.volume24h) * btcSpotValue;

      i.openInterest = openInterest;
      i.tradingVolume = tradingVolume;

      try {
        await cache.setBitcomInstrument({
          instrumentID,
          openInterest,
          tradingVolume
        });
      }
      catch (err) {
        console.log("bit.com cache error");
        console.error(err);
      }
    }
    else if (i.coinCurrencyID === CURRENCY_ID.ETH) {
      openInterest = Number(tickerResult.open_interest) * ethSpotValue;
      tradingVolume = Number(tickerResult.volume24h) * ethSpotValue;

      i.openInterest = openInterest;
      i.tradingVolume = tradingVolume;

      try {
        await cache.setBitcomInstrument({
          instrumentID,
          openInterest,
          tradingVolume
        });
      }
      catch (err) {
        console.log("bit.com cache error");
        console.error(err);
      }
    }

    return;
  }
}

function _getOIAndNVSum (
  valueArr: BitcomSyncValue[]
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

async function _getMarketTrades (
): Promise<BitcomMarketTradeResult[]> {

  let btcTrades: BitcomMarketTradeResult[] = [];
  let ethTrades: BitcomMarketTradeResult[] = [];

  try {
    btcTrades = await getMarketTrades({ coinCurrencyPair: "BTC-USD" });
    ethTrades = await getMarketTrades({ coinCurrencyPair: "ETH-USD" });
  }
  catch (err) {
    throw err;
  }

  return [...btcTrades, ...ethTrades];
}

function _assignBTValues (
  marketTrades: BitcomMarketTradeResult[],
  btValueArr: BitcomBlockTradeValue[]
): void {

  marketTrades.forEach(trade => {
    if (trade.is_block_trade) {
      btValueArr.push({
        blockTradeID: BigInt(trade.trade_id),
        instrumentID: trade.instrument_id,
        tradeID: BigInt(trade.trade_id),
        tradeTime: Math.floor(Number(trade.created_at) / 1000),
        side: trade.side,
        price: Number(trade.price),
        underlyingPrice: Number(trade.underlying_price),
        size: Number(trade.qty),
        sigma: Number(trade.sigma),
        rawData: JSON.stringify(trade)
      });
    }
  });

  return;
}

async function _insertExpiryData (
  conn: DBConnection,
  valueArr: BitcomSyncValue[],
  timestamp: number // unix timestamp in seconds
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: BitcomSyncValue): Promise<void> {
    try {
      await insertExpiryData(
        conn,
        EXCHANGE_ID.BITCOM,
        item.coinCurrencyID,
        timestamp,
        item.expiry,
        item.strike,
        item.callOrPut,
        <number>item.tradingVolume,
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
      EXCHANGE_ID.BITCOM,
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
      EXCHANGE_ID.BITCOM,
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
  btValueArr: BitcomBlockTradeValue[]
): Promise<void> {

  try {
    await eachSeries(btValueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: BitcomBlockTradeValue): Promise<void> {
    const coinCurrency = <"BTC" | "ETH">item.instrumentID.substring(0, 3);
    const coinCurrencyID = CURRENCY_ID[coinCurrency];

    try {
      await insertBitcomBlockTrade(
        conn,
        uuidV4(),
        coinCurrencyID,
        item.blockTradeID,
        item.instrumentID,
        item.tradeID,
        item.tradeTime,
        item.side,
        item.price,
        item.underlyingPrice,
        item.size,
        item.sigma,
        item.rawData
      );
    }
    catch (err) {
      throw err;
    }

    return;
  }
}