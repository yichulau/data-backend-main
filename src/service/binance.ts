import axios from "axios";

import { binance } from "common";

export async function getIndexPrice (
  params: BinanceIndexPriceParams
): Promise<number> {
  try {
    const { data } = await axios({
      method: "get",
      url: binance.indexPriceURL,
      params: {
        underlying: params.coinCurrencyPair
      }
    });

    return Number(data.indexPrice);
  }
  catch (err) {
    throw err;
  }
}

export async function getMarkPrice (
  params: BinanceMarkPriceParams
): Promise<BinanceMarkPriceResult> {
  try {
    const { data } = await axios({
      method: "get",
      url: binance.markPriceURL,
      params: {
        symbol: params.instrumentID
      }
    });

    return data[0];
  }
  catch (err) {
    throw err;
  }
}

export async function getTickers (
): Promise<BinanceTickerResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: binance.tickerURL
    });

    return data;
  }
  catch (err) {
    throw err;
  }
}

// gets all open interest of a currency + expiration
export async function getOpenInterest (
  params: BinanceOIParams
): Promise<BinanceOIResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: binance.openInterestURL,
      params: {
        underlyingAsset: params.coinCurrency,
        expiration: params.expiration
      }
    });

    return data;
  }
  catch (err) {
    throw err;
  }
}