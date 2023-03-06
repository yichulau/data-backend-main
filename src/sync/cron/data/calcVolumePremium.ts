import DBConnection from "@database/conn";

import { insert } from "@resource/volumePremium";

import {
  getLast24HBinanceContracts,
  getLast24HBitcomContracts,
  getLast24HBybitContracts,
  getLast24HDeribitContracts,
  getLast24HOkexContracts
} from "@resource/contractsTraded";

import {
  CURRENCY_ID,
  EXCHANGE_ID
} from "../../../common";

export default async function (
  conn: DBConnection,
  syncTime: number, // unix timestamp in seconds
  btcSpotValue: number,
  ethSpotValue: number,
  solSpotValue: number
): Promise<void> {

  const startTime = Date.now();

  try {
    const binanceContracts = await _getLast24HContracts(conn, EXCHANGE_ID.BINANCE);
    const bitcomContracts = await _getLast24HContracts(conn, EXCHANGE_ID.BITCOM);
    const bybitContracts = await _getLast24HContracts(conn, EXCHANGE_ID.BYBIT);
    const deribitContracts = await _getLast24HContracts(conn, EXCHANGE_ID.DERIBIT);
    const okexContracts = await _getLast24HContracts(conn, EXCHANGE_ID.OKEX);

    const {
      binanceBTCvolPrem,
      binanceETHvolPrem,
      binanceSOLvolPrem,
      bitcomBTCvolPrem,
      bitcomETHvolPrem,
      bitcomSOLvolPrem,
      bybitBTCvolPrem,
      bybitETHvolPrem,
      bybitSOLvolPrem,
      deribitBTCvolPrem,
      deribitETHvolPrem,
      deribitSOLvolPrem,
      okexBTCvolPrem,
      okexETHvolPrem,
      okexSOLvolPrem
    } = _getPremiumVolume(
      binanceContracts,
      bitcomContracts,
      bybitContracts,
      deribitContracts,
      okexContracts,
      btcSpotValue,
      ethSpotValue,
      solSpotValue
    );

    await _insertPremiumVolume(conn, CURRENCY_ID.BTC, EXCHANGE_ID.BINANCE, syncTime, binanceBTCvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.ETH, EXCHANGE_ID.BINANCE, syncTime, binanceETHvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.SOL, EXCHANGE_ID.BINANCE, syncTime, binanceSOLvolPrem);

    await _insertPremiumVolume(conn, CURRENCY_ID.BTC, EXCHANGE_ID.BITCOM, syncTime, bitcomBTCvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.ETH, EXCHANGE_ID.BITCOM, syncTime, bitcomETHvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.SOL, EXCHANGE_ID.BITCOM, syncTime, bitcomSOLvolPrem);

    await _insertPremiumVolume(conn, CURRENCY_ID.BTC, EXCHANGE_ID.BYBIT, syncTime, bybitBTCvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.ETH, EXCHANGE_ID.BYBIT, syncTime, bybitETHvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.SOL, EXCHANGE_ID.BYBIT, syncTime, bybitSOLvolPrem);

    await _insertPremiumVolume(conn, CURRENCY_ID.BTC, EXCHANGE_ID.DERIBIT, syncTime, deribitBTCvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.ETH, EXCHANGE_ID.DERIBIT, syncTime, deribitETHvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.SOL, EXCHANGE_ID.DERIBIT, syncTime, deribitSOLvolPrem);

    await _insertPremiumVolume(conn, CURRENCY_ID.BTC, EXCHANGE_ID.OKEX, syncTime, okexBTCvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.ETH, EXCHANGE_ID.OKEX, syncTime, okexETHvolPrem);
    await _insertPremiumVolume(conn, CURRENCY_ID.SOL, EXCHANGE_ID.OKEX, syncTime, okexSOLvolPrem);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`premium volume calc completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("premium volume calc error");
    console.error(err);
  }

  return;
}

async function _getLast24HContracts (
  conn: DBConnection,
  exchangeID: number
): Promise<any[]> {

  let result = [];

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BINANCE:
        result = await getLast24HBinanceContracts(conn);
        break;

      case EXCHANGE_ID.BITCOM:
        result = await getLast24HBitcomContracts(conn);
        break;

      case EXCHANGE_ID.BYBIT:
        result = await getLast24HBybitContracts(conn);
        break;

      case EXCHANGE_ID.DERIBIT:
        result = await getLast24HDeribitContracts(conn);
        break;

      case EXCHANGE_ID.OKEX:
        result = await getLast24HOkexContracts(conn);
        break;
    }
  }
  catch (err) {
    throw err;
  }

  return result;
}

function _getPremiumVolume (
  binanceContracts: any[],
  bitcomContracts: any[],
  bybitContracts: any[],
  deribitContracts: any[],
  okexContracts: any[],
  btcSpotValue: number,
  ethSpotValue: number,
  solSpotValue: number
): {
  binanceBTCvolPrem: number,
  binanceETHvolPrem: number,
  binanceSOLvolPrem: number,
  bitcomBTCvolPrem: number,
  bitcomETHvolPrem: number,
  bitcomSOLvolPrem: number,
  bybitBTCvolPrem: number,
  bybitETHvolPrem: number,
  bybitSOLvolPrem: number,
  deribitBTCvolPrem: number,
  deribitETHvolPrem: number,
  deribitSOLvolPrem: number,
  okexBTCvolPrem: number,
  okexETHvolPrem: number,
  okexSOLvolPrem: number;
} {

  let binanceBTCvolPrem = 0;
  let binanceETHvolPrem = 0;
  let binanceSOLvolPrem = 0;
  let bitcomBTCvolPrem = 0;
  let bitcomETHvolPrem = 0;
  let bitcomSOLvolPrem = 0;
  let bybitBTCvolPrem = 0;
  let bybitETHvolPrem = 0;
  let bybitSOLvolPrem = 0;
  let deribitBTCvolPrem = 0;
  let deribitETHvolPrem = 0;
  let deribitSOLvolPrem = 0;
  let okexBTCvolPrem = 0;
  let okexETHvolPrem = 0;
  let okexSOLvolPrem = 0;

  binanceContracts.forEach(item => {
    const premiumVolume = Number(item.price) * Number(item.quantity);

    switch (item.coinCurrencyID) {
      case CURRENCY_ID.BTC: binanceBTCvolPrem += premiumVolume; break;
      case CURRENCY_ID.ETH: binanceETHvolPrem += premiumVolume; break;
      case CURRENCY_ID.SOL: binanceSOLvolPrem += premiumVolume; break;
    }
  });

  bitcomContracts.forEach(item => {
    const premiumVolume = Number(item.price) * Number(item.quantity);

    switch (item.coinCurrencyID) {
      case CURRENCY_ID.BTC: bitcomBTCvolPrem += premiumVolume; break;
      case CURRENCY_ID.ETH: bitcomETHvolPrem += premiumVolume; break;
      case CURRENCY_ID.SOL: bitcomSOLvolPrem += premiumVolume; break;
    }
  });

  bybitContracts.forEach(item => {
    const premiumVolume = Number(item.orderPrice) * Number(item.positionQuantity);

    switch (item.coinCurrencyID) {
      case CURRENCY_ID.BTC: bybitBTCvolPrem += premiumVolume; break;
      case CURRENCY_ID.ETH: bybitETHvolPrem += premiumVolume; break;
      case CURRENCY_ID.SOL: bybitSOLvolPrem += premiumVolume; break;
    }
  });

  deribitContracts.forEach(item => {
    const premiumVolume = Number(item.price) * Number(item.amount);

    switch (item.coinCurrencyID) {
      case CURRENCY_ID.BTC: deribitBTCvolPrem += premiumVolume * btcSpotValue; break;
      case CURRENCY_ID.ETH: deribitETHvolPrem += premiumVolume * ethSpotValue; break;
      case CURRENCY_ID.SOL: deribitSOLvolPrem += premiumVolume * solSpotValue; break;
    }
  });

  okexContracts.forEach(item => {
    const premiumVolume = Number(item.price) * Number(item.quantity);

    switch (item.coinCurrencyID) {
      case CURRENCY_ID.BTC: okexBTCvolPrem += premiumVolume; break;
      case CURRENCY_ID.ETH: okexETHvolPrem += premiumVolume; break;
      case CURRENCY_ID.SOL: okexSOLvolPrem += premiumVolume; break;
    }
  });

  return {
    binanceBTCvolPrem,
    binanceETHvolPrem,
    binanceSOLvolPrem,
    bitcomBTCvolPrem,
    bitcomETHvolPrem,
    bitcomSOLvolPrem,
    bybitBTCvolPrem,
    bybitETHvolPrem,
    bybitSOLvolPrem,
    deribitBTCvolPrem,
    deribitETHvolPrem,
    deribitSOLvolPrem,
    okexBTCvolPrem,
    okexETHvolPrem,
    okexSOLvolPrem
  };
}

async function _insertPremiumVolume (
  conn: DBConnection,
  coinCurrencyID: number,
  exchangeID: number,
  timestamp: number, // unix timestamp in seconds
  value: number
): Promise<void> {

  try {
    await insert(
      conn,
      coinCurrencyID,
      exchangeID,
      timestamp,
      value
    );
  }
  catch (err) {
    throw err;
  }

  return;
}