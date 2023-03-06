import { getTickers as getBinanceTickers } from "@service/binance";
import { getInstruments as getBitcomInstruments } from "@service/bitcom";
import { getTicker as getBybitTickers } from "@service/bybit";
import { getInstruments as getDeribitInstruments } from "@service/deribit";
import { getTicker as getOkexTickers } from "@service/okex";

import logReqDuration from "helper/logReqDuration";

import {
  CURRENCY_ID,
  EXCHANGE_ID
} from "common";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let coinCurrency = "";
  let instruments: string[] = [];

  const coinCurrencyID = req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  switch (coinCurrencyID) {
    case CURRENCY_ID.BTC: coinCurrency = "BTC"; break;
    case CURRENCY_ID.ETH: coinCurrency = "ETH"; break;
    case CURRENCY_ID.SOL: coinCurrency = "SOL"; break;
  }

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BINANCE:
        instruments = await _getBinanceSymbols(coinCurrency);
        break;

      case EXCHANGE_ID.BITCOM:
        instruments = await _getBitcomInstruments(<"BTC" | "ETH">coinCurrency);
        break;

      case EXCHANGE_ID.BYBIT:
        instruments = await _getBybitSymbols(<"BTC" | "ETH" | "SOL">coinCurrency);
        break;

      case EXCHANGE_ID.DERIBIT:
        instruments = await _getDeribitInstruments(<"BTC" | "ETH">coinCurrency);
        break;

      case EXCHANGE_ID.OKEX:
        instruments = await _getOkexInstruments(<"BTC" | "ETH">coinCurrency);
        break;
    }
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  res.send(instruments);

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}

async function _getBinanceSymbols (
  coinCurrency: string
): Promise<string[]> {

  let result;
  let symbols: string[] = [];

  try {
    result = await getBinanceTickers();
  }
  catch (err) {
    throw err;
  }

  symbols = result.map(i => i.symbol);
  symbols = symbols.filter(i => i.startsWith(coinCurrency));

  return symbols;
}

async function _getBitcomInstruments (
  coinCurrency: "BTC" | "ETH"
): Promise<string[]> {

  try {
    const result = await getBitcomInstruments({ coinCurrency });
    return result.map(i => i.instrument_id);
  }
  catch (err) {
    throw err;
  }
}

async function _getBybitSymbols (
  coinCurrency: "BTC" | "ETH" | "SOL"
): Promise<string[]> {

  try {
    const result = await getBybitTickers({ coinCurrency });
    return result.map(i => i.symbol);
  }
  catch (err) {
    throw err;
  }
}

async function _getDeribitInstruments (
  coinCurrency: "BTC" | "ETH"
): Promise<string[]> {

  try {
    const result = await getDeribitInstruments({ coinCurrency });
    return result.map(i => i.instrument_name);
  }
  catch (err) {
    throw err;
  }
}

async function _getOkexInstruments (
  coinCurrency: "BTC" | "ETH"
): Promise<string[]> {

  try {
    const result = await getOkexTickers({
      coinCurrencyPair: `${coinCurrency}-USD`
    });

    return result.map(i => i.instId);
  }
  catch (err) {
    throw err;
  }
}