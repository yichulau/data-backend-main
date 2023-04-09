import moment from "moment";
import { each, eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import cache from "@cache/cache";
import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";
import { insert as insertGammaData } from "@resource/gamma";

import {
  getBookSummaryByCurrency,
  getInstruments,
  getTicker
} from "@service/deribit";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type DeribitSyncValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  instrumentName: string,
  expiry: string,
  strike: number,
  tradingVolume?: number,
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

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  let valueArr: DeribitSyncValue[] = [];

  try {
    const instruments = await _getInstruments();

    _assignStrikeAndExpiry(instruments, valueArr);
    await _assignRawOIAndVolume(valueArr);
    await _assignGammaValues(valueArr, btcSpotValue, ethSpotValue);

    await _insertGammaData(conn, valueArr, syncTime);

    const {
      btcOpenInterestSum,
      ethOpenInterestSum,
      btcNotionalVolume,
      ethNotionalVolume
    } = _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue);

    await _insertExpiryData(conn, valueArr, syncTime);

    await _insertNotionalVolume(conn, CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
    await _insertNotionalVolume(conn, CURRENCY_ID.ETH, syncTime, ethNotionalVolume);

    await _insertOpenInterest(conn, CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
    await _insertOpenInterest(conn, CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`deribit data sync completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("deribit data sync error");
    console.error(err);
  }

  return;
}

async function _getInstruments (
): Promise<DeribitInstrumentsResult[]> {

  let btcInstruments: DeribitInstrumentsResult[];
  let ethInstruments: DeribitInstrumentsResult[];

  try {
    btcInstruments = await getInstruments({ coinCurrency: "BTC" });
    ethInstruments = await getInstruments({ coinCurrency: "ETH" });
  }
  catch (err) {
    throw err;
  }

  return [...btcInstruments, ...ethInstruments];
}

function _assignStrikeAndExpiry (
  instruments: DeribitInstrumentsResult[],
  valueArr: DeribitSyncValue[]
): void {

  instruments.forEach(item => {
    let coinCurrencyID = 0;
    const callOrPut = <"C" | "P">item.instrument_name.slice(-1);
    const expiry = moment(item.expiration_timestamp).format(DATEFORMAT);

    if (item.base_currency === "BTC") {
      coinCurrencyID = CURRENCY_ID.BTC;
    }
    else if (item.base_currency === "ETH") {
      coinCurrencyID = CURRENCY_ID.ETH;
    }

    valueArr.push({
      coinCurrencyID,
      callOrPut,
      instrumentName: item.instrument_name,
      expiry,
      strike: item.strike
    });
  });

  return;
}

async function _assignRawOIAndVolume (
  valueArr: DeribitSyncValue[],
): Promise<void> {

  let btcResult: DeribitBookSummaryResult[] = [];
  let ethResult: DeribitBookSummaryResult[] = [];
  let combinedResults: DeribitBookSummaryResult[] = [];

  try {
    btcResult = await getBookSummaryByCurrency({ coinCurrency: "BTC" });
    ethResult = await getBookSummaryByCurrency({ coinCurrency: "ETH" });
  }
  catch (err) {
    throw err;
  }

  combinedResults = [...btcResult, ...ethResult];

  combinedResults.forEach(item => {
    const value = <DeribitSyncValue>valueArr.find(i => {
      return i.instrumentName === item.instrument_name;
    });

    if (item.base_currency === "BTC") {
      value.tradingVolume = item.volume;
      value.openInterest = item.open_interest;
    }
    else if (item.base_currency === "ETH") {
      value.tradingVolume = item.volume;
      value.openInterest = item.open_interest;
    }
  });

  return;
}

async function _assignGammaValues (
  valueArr: DeribitSyncValue[],
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  // const btcSpotUpperBound = btcSpotValue * 1.55;
  // const btcSpotLowerBound = btcSpotValue * 0.5;
  // const ethSpotUpperBound = ethSpotValue * 1.55;
  // const ethSpotLowerBound = ethSpotValue * 0.5;

  // for (const idx in valueArr) {
  //   if (
  //     valueArr[idx].coinCurrencyID === CURRENCY_ID.BTC
  //     &&
  //     (valueArr[idx].strike > btcSpotUpperBound || valueArr[idx].strike < btcSpotLowerBound)
  //   ) {
  //     valueArr.splice(Number(idx), 1);
  //   }
  //   else if (
  //     valueArr[idx].coinCurrencyID === CURRENCY_ID.ETH
  //     &&
  //     (valueArr[idx].strike > ethSpotUpperBound || valueArr[idx].strike < ethSpotLowerBound)
  //   ) {
  //     valueArr.splice(Number(idx), 1);
  //   }
  // }

  try {
    await each(valueArr, _iterate);
  }
  catch (err) {
    throw err;
  }
  return;

  async function _iterate (i: DeribitSyncValue): Promise<void> {
    let tickerResult;
    const instrumentName = i.instrumentName;

    try {
      const existing = await cache.getDeribitTicker(instrumentName);

      if (existing) {
        i.lastPrice = existing.lastPrice;
        i.net = existing.net;
        i.bid = existing.bid;
        i.ask = existing.ask;
        i.vol = existing.vol;
        i.iv = existing.iv;
        i.delta = existing.delta;
        i.gamma = existing.gamma;

        return;
      }
    }
    catch (err) {
      console.log("deribit cache error");
      console.error(err);
    }

    do {
      try {
        tickerResult = await getTicker({ instrumentName });
      }
      catch (err: any) {
        if (err.response?.status !== 429) {
          throw err;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    while (typeof tickerResult === "undefined");

    i.lastPrice = tickerResult.last_price || 0;
    i.net = tickerResult.stats.price_change || 0;
    i.bid = tickerResult.best_bid_price;
    i.ask = tickerResult.best_ask_price;
    i.vol = tickerResult.stats.volume || 0;
    i.iv = tickerResult.mark_iv;
    i.delta = tickerResult.greeks.delta;
    i.gamma = tickerResult.greeks.gamma;

    try {
      await cache.setDeribitTicker({
        instrumentName,
        lastPrice: i.lastPrice,
        net: i.net,
        bid: i.bid,
        ask: i.ask,
        vol: i.vol,
        iv: i.iv,
        delta: i.delta,
        gamma: i.gamma
      });
    }
    catch (err) {
      console.log("deribit cache error");
      console.error(err);
    }

    return;
  }
}

function _getOIAndNVSum (
  valueArr: DeribitSyncValue[],
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

  valueArr.forEach(item => {
    if (item.coinCurrencyID === CURRENCY_ID.BTC) {
      item.openInterest = <number>item.openInterest * btcSpotValue;
      item.tradingVolume = <number>item.tradingVolume * btcSpotValue;

      btcOpenInterestSum += item.openInterest;
      btcNotionalVolume += item.tradingVolume;
    }
    else if (item.coinCurrencyID === CURRENCY_ID.ETH) {
      item.openInterest = <number>item.openInterest * ethSpotValue;
      item.tradingVolume = <number>item.tradingVolume * ethSpotValue;

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

async function _insertGammaData (
  conn: DBConnection,
  valueArr: DeribitSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: DeribitSyncValue): Promise<void> {
    try {
      await insertGammaData(
        conn,
        EXCHANGE_ID.DERIBIT,
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
        <number>item.tradingVolume,
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
  valueArr: DeribitSyncValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(valueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: DeribitSyncValue): Promise<void> {
    try {
      await insertExpiryData(
        conn,
        EXCHANGE_ID.DERIBIT,
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
      EXCHANGE_ID.DERIBIT,
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
      EXCHANGE_ID.DERIBIT,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}