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

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BITCOM:
        result = await getRecentBitcomBlockTrades(null, "6hour", coinCurrencyID);
        break;

      case EXCHANGE_ID.BYBIT:
        result = await getRecentBybitBlockTrades(null, "6hour", coinCurrencyID);
        break;

      case EXCHANGE_ID.DERIBIT:
        result = await getRecentDeribitBlockTrades(null, "6hour", coinCurrencyID);
        break;

      case EXCHANGE_ID.OKEX:
        result = await getRecentOkexBlockTrades(null, "6hour", coinCurrencyID);
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