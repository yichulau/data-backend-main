import { getSpotValue } from "@service/okex";

import logReqDuration from "helper/logReqDuration";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let spotValue = 0;
  let coinCurrency = "";

  const coinCurrencyID = <number>req._coinCurrencyID;

  switch (coinCurrencyID) {
    case 1: coinCurrency = "BTC-USD"; break;
    case 2: coinCurrency = "ETH-USD"; break;
    case 3: coinCurrency = "SOL-USD"; break;
  }

  try {
    spotValue = await _getSpotValue(
      <"BTC-USD" | "ETH-USD" | "SOL-USD">coinCurrency
    );
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  res.send({ spotValue });
  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}

async function _getSpotValue (
  coinCurrency: "BTC-USD" | "ETH-USD" | "SOL-USD"
): Promise<number> {

  try {
    return await getSpotValue(coinCurrency);
  }
  catch (err) {
    throw err;
  }
}