import axios from "axios";

import { bitcom } from "common";

export async function getInstruments (
  params: BitcomInstrumentParams
): Promise<BitcomInstrumentResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: bitcom.instrumentURL,
      params: {
        currency: params.coinCurrency,
        category: "option",
        active: "true"
      }
    });

    if (data.code !== 0) {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}

export async function getTicker (
  params: BitcomTickerParams
): Promise<BitcomTickerResult> {
  try {
    const { data } = await axios({
      method: "get",
      url: bitcom.tickerURL,
      params: {
        instrument_id: params.instrumentID
      }
    });

    if (data.code !== 0) {
      throw data;
    }

    return data.data;
  }
  catch (err) {
    throw err;
  }
}