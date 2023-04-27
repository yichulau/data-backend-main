import {
  getRecentBitcomBlockTrades,
  getRecentBybitBlockTrades,
  getRecentDeribitBlockTrades,
  getRecentOkexBlockTrades
} from "@resource/blockTrade";

import logReqDuration from "helper/logReqDuration";

import { EXCHANGE_ID } from "common";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let result = [];

  const coinCurrencyID = <number>req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  const duration = req.query.duration;

  if (duration !== "24hour" && duration !== "6hour") {
    return next({
      status: 400
    });
  }

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BITCOM:
        result = await getRecentBitcomBlockTrades(null, duration, coinCurrencyID);
        break;

      case EXCHANGE_ID.BYBIT:
        result = await getRecentBybitBlockTrades(null, duration, coinCurrencyID);
        break;

      case EXCHANGE_ID.DERIBIT:
        result = await getRecentDeribitBlockTrades(null, duration, coinCurrencyID);
        break;

      case EXCHANGE_ID.OKEX:
        result = await getRecentOkexBlockTrades(null, duration, coinCurrencyID);
        break;
    }
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  res.send({ 
    count: result.length,
    result
  });

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}