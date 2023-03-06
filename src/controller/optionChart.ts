import {
  getLatestExpiryData,
  getExpiryDates,
  getStrikes
} from "@resource/expiry";

import logReqDuration from "helper/logReqDuration";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let result: OptionChartResult = {
    expiryData: [],
    strikeData: [],
    expiryList: [],
    strikeList: []
  };

  const coinCurrencyID = req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  const expiry = req.query.expiry;
  const strike = req.query.strike;

  try {
    const { expiryData, strikeData } = await getLatestExpiryData(
      null,
      exchangeID,
      coinCurrencyID,
      <string>expiry,
      <string>strike
    );

    result.expiryData = expiryData;
    result.strikeData = strikeData;

    result.expiryList = await getExpiryDates(null, exchangeID, coinCurrencyID);
    result.strikeList = await getStrikes(null, exchangeID, coinCurrencyID);
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  res.send(result);

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}