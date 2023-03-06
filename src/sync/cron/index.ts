import Cron from "croner";

import db from "@database/db";
import DBConnection from "@database/conn";

import { getSpotValue } from "@service/okex";

import syncBinance from "./api/binance";
import syncBitcom from "./api/bitcom";
import syncBybit from "./api/bybit";
import syncDeribit from "./api/deribit";
import syncOkex from "./api/okex";

import deleteExpiry from "./data/deleteExpiry";
import calcPremiumVolume from "./data/calcVolumePremium";

const cronInterval = "0,30 */1 * * *";

export default function () {
  Cron(cronInterval, _main);
}

async function _main () {
  console.log(`starting data sync ${Date()}`);
  const nowSeconds = Math.floor(Date.now() / 1000);

  let dbConn: DBConnection | undefined;

  try {
    const btcSpotValue = await _getSpotValue("BTC-USDT");
    const ethSpotValue = await _getSpotValue("ETH-USDT");
    const solSpotValue = await _getSpotValue("SOL-USDT");

    dbConn = await db.getConnection();

    await deleteExpiry(dbConn);

    await syncBinance(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
    await syncBitcom(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
    await syncBybit(dbConn, nowSeconds, btcSpotValue, ethSpotValue, solSpotValue);
    await syncDeribit(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
    await syncOkex(dbConn, nowSeconds, btcSpotValue, ethSpotValue);

    await calcPremiumVolume(dbConn, nowSeconds, btcSpotValue, ethSpotValue, solSpotValue);

    console.log(`data sync completed ${Date()}`);
  }
  catch (err) {
    console.log(`data sync error ${Date()}`);
    console.error(err);
  }
  finally {
    dbConn?.release();
  }

  return;
}

async function _getSpotValue (
  coinCurrency: "BTC-USDT" | "ETH-USDT" | "SOL-USDT"
): Promise<number> {

  try {
    const result = await getSpotValue(coinCurrency);
    return result;
  }
  catch (err) {
    throw err;
  }
}