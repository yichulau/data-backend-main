import axios from "axios";

import { bybit } from "common";

// bybit APIs always return status 200 even if error

export async function getTicker (
  params: BybitTickerParams
): Promise<BybitTickerResult[]> {
  try {
    const { data } = await axios({
      method: "get",
      url: bybit.tickerURL,
      params: {
        category: "option",
        baseCoin: params.coinCurrency
      }
    });

    if (data.retCode !== 0) {
      throw data;
    }

    return data.result.list;
  }
  catch (err) {
    throw err;
  }
}