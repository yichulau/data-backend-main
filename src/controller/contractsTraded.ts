import {
  getLast24HBinanceContracts,
  getLast24HBitcomContracts,
  getLast24HBybitContracts,
  getLast24HDeribitContracts,
  getLast24HOkexContracts
} from "@resource/contractsTraded";

import logReqDuration from "helper/logReqDuration";

import { EXCHANGE_ID } from "common";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let result24H = [];

  const coinCurrencyID = req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BINANCE:
        result24H = await getLast24HBinanceContracts(null, <number>coinCurrencyID);
        break;

      case EXCHANGE_ID.BITCOM:
        result24H = await getLast24HBitcomContracts(null, <number>coinCurrencyID);
        break;

      case EXCHANGE_ID.BYBIT:
        result24H = await getLast24HBybitContracts(null, <number>coinCurrencyID);
        break;

      case EXCHANGE_ID.DERIBIT:
        result24H = await getLast24HDeribitContracts(null, <number>coinCurrencyID);
        break;

      case EXCHANGE_ID.OKEX:
        result24H = await getLast24HOkexContracts(null, <number>coinCurrencyID);
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
    count24H: result24H.length,
    result24H
  });

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}