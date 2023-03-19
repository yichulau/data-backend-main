import moment from "moment";
import { eachSeries } from "async";

import DBConnection from "@database/conn";

import { insert as insertVolumeNotional } from "@resource/volumeNotional";
import { insert as insertOpenInterest } from "@resource/openInterest";
import { insert as insertExpiryData } from "@resource/expiry";

import {
  getBookSummaryByCurrency,
  getInstruments
} from "@service/deribit";

import {
  CURRENCY_ID,
  EXCHANGE_ID,
  DATEFORMAT
} from "../../../common";

type DeribitOIAndNVValue = {
  coinCurrencyID: number,
  callOrPut: "C" | "P",
  instrumentName: string,
  expiry: string,
  strike: number,
  tradingVolume?: number,
  openInterest?: number;
};

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  let oiAndNvValueArr: DeribitOIAndNVValue[] = [];

  try {
    await _assignStrikeAndExpiry(oiAndNvValueArr);
    await _assignOIAndVolume(oiAndNvValueArr, btcSpotValue, ethSpotValue);

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

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`deribit data sync completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("deribit data sync error");
    console.error(err);
  }

  return;
}

async function _assignStrikeAndExpiry (
  oiAndNvValueArr: DeribitOIAndNVValue[]
): Promise<void> {

  let btcResult: DeribitInstrumentsResult[] = [];
  let ethResult: DeribitInstrumentsResult[] = [];
  let combinedResults: DeribitInstrumentsResult[] = [];

  try {
    btcResult = await getInstruments({ coinCurrency: "BTC" });
    ethResult = await getInstruments({ coinCurrency: "ETH" });
  }
  catch (err) {
    throw err;
  }

  combinedResults = [...btcResult, ...ethResult];

  combinedResults.forEach(item => {
    let coinCurrencyID = 0;
    const callOrPut = <"C" | "P">item.instrument_name.slice(-1);
    const expiry = moment(item.expiration_timestamp).format(DATEFORMAT);

    if (item.base_currency === "BTC") {
      coinCurrencyID = CURRENCY_ID.BTC;
    }
    else if (item.base_currency === "ETH") {
      coinCurrencyID = CURRENCY_ID.ETH;
    }

    oiAndNvValueArr.push({
      coinCurrencyID,
      callOrPut,
      instrumentName: item.instrument_name,
      expiry,
      strike: item.strike
    });
  });

  return;
}

async function _assignOIAndVolume (
  oiAndNvValueArr: DeribitOIAndNVValue[],
  btcSpotValue: number,
  ethSpotValue: number
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
    const value = <DeribitOIAndNVValue>oiAndNvValueArr.find(i => {
      return i.instrumentName === item.instrument_name;
    });

    if (item.base_currency === "BTC") {
      value.tradingVolume = item.volume * btcSpotValue;
      value.openInterest = item.open_interest * btcSpotValue;
    }
    else if (item.base_currency === "ETH") {
      value.tradingVolume = item.volume * ethSpotValue;
      value.openInterest = item.open_interest * ethSpotValue;
    }
  });

  return;
}

function _getOIAndNVSum (
  oiAndNvValueArr: DeribitOIAndNVValue[]
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

async function _insertExpiryData (
  conn: DBConnection,
  oiAndNvValueArr: DeribitOIAndNVValue[],
  timestamp: number
): Promise<void> {

  try {
    await eachSeries(oiAndNvValueArr, _iterateInsert);
  }
  catch (err) {
    throw err;
  }

  return;

  async function _iterateInsert (item: DeribitOIAndNVValue): Promise<void> {
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