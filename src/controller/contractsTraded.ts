import {
  getRecentBinanceContracts,
  countRecentBinanceContracts,
  getRecentBitcomContracts,
  countRecentBitcomContracts,
  getRecentBybitContracts,
  countRecentBybitContracts,
  getRecentDeribitContracts,
  countRecentDeribitContracts,
  getRecentOkexContracts,
  countRecentOkexContracts
} from "@resource/contractsTraded";

import logReqDuration from "helper/logReqDuration";

import { EXCHANGE_ID } from "common";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let count24H = 0;
  let result24H = [];

  const coinCurrencyID = <number>req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  try {
    switch (exchangeID) {
      case EXCHANGE_ID.BINANCE:
        count24H = await countRecentBinanceContracts(null, "1day", coinCurrencyID);
        result24H = await getRecentBinanceContracts(null, "1day", coinCurrencyID, 5000);
        break;

      case EXCHANGE_ID.BITCOM:
        count24H = await countRecentBitcomContracts(null, "1day", coinCurrencyID);
        result24H = await getRecentBitcomContracts(null, "1day", coinCurrencyID, 5000);
        break;

      case EXCHANGE_ID.BYBIT:
        count24H = await countRecentBybitContracts(null, "1day", coinCurrencyID);
        result24H = await getRecentBybitContracts(null, "1day", coinCurrencyID, 5000);
        break;

      case EXCHANGE_ID.DERIBIT:
        count24H = await countRecentDeribitContracts(null, "1day", coinCurrencyID);
        result24H = await getRecentDeribitContracts(null, "1day", coinCurrencyID, 5000);
        break;

      case EXCHANGE_ID.OKEX:
        count24H = await countRecentOkexContracts(null, "1day", coinCurrencyID);
        result24H = await getRecentOkexContracts(null, "1day", coinCurrencyID, 5000);
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
    count24H,
    result24H
  });

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}
