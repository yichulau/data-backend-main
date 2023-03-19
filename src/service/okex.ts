import axios from "axios";

import { okex } from "../common";

export async function getSpotValue (
  currency: string
): Promise<number> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.tickerIndexURL,
      params: {
        instId: currency
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return Number(data.data[0].idxPx);
  }
  catch (err) {
    throw err;
  }
}

export async function getOpenInterest (
  params: OKEXOIParams
): Promise<OKEXOIResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.openInterestURL,
      params: {
        instType: "OPTION",
        instFamily: params.coinCurrencyPair
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}

export async function getTicker (
  params: OKEXTickerParams
): Promise<OKEXTickerResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.tickerURL,
      params: {
        instType: "OPTION",
        instFamily: params.coinCurrencyPair
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}

export async function getOptionSummary (
  params: OKEXOptSummaryParams
): Promise<OKEXOptSummaryResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.optSummaryURL,
      params: {
        instFamily: params.coinCurrencyPair
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}

export async function getMarkPrice (
  params: OKEXMarkPriceParams
): Promise<number> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.markPriceURL,
      params: {
        instType: "OPTION",
        instId: params.instrumentID
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return Number(data.data[0].markPx);
  }
  catch (err) {
    throw err;
  }
}

export async function getOIAndVolumeStrike (
  params: OKEXOIVolumeStrikeParams
): Promise<string[][]> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.oiAndVolumeStrikeURL,
      params: {
        ccy: params.coinCurrency,
        expTime: params.contractExpiry,
        period: "1D"
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}

export async function getOIAndVolumeExpiry (
  params: OKEXOIVolumeExpiryParams
): Promise<string[][]> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.oiAndVolumeExpiryURL,
      params: {
        ccy: params.coinCurrency,
        period: "1D"
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}

export async function getBlockTrades (
  params: OKEXBlockTradeParams
): Promise<OKEXBlockTradeResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: okex.blockTradeURL,
      params: {
        beginId: params.beginID,
        limit: 100
      }
    });

    if (data.code !== "0") {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}