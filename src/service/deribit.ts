import axios from "axios";

import { deribit } from "common";

export async function getBookSummaryByCurrency (
  params: DeribitBookSummaryParams
): Promise<DeribitBookSummaryResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: deribit.openInterestURL,
      params: {
        currency: params.coinCurrency,
        kind: "option"
      }
    });

    return data.result;
  }
  catch (err) {
    throw err;
  }
}

export async function getInstruments (
  params: DeribitInstrumentsParams
): Promise<DeribitInstrumentsResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: deribit.instrumentsURL,
      params: {
        currency: params.coinCurrency,
        kind: "option"
      }
    });

    return data.result;
  }
  catch (err) {
    throw err;
  }
}

export async function getTicker (
  params: DeribitTickerParams
): Promise<DeribitTickerResult> {
  try {
    const { data } = await axios({
      method: "get",
      url: deribit.tickerURL,
      params: {
        instrument_name: params.instrumentName
      }
    });

    return data.result;
  }
  catch (err) {
    throw err;
  }
}