import { get } from "@resource/volumeNotional";

import logReqDuration from "helper/logReqDuration";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let result = [];

  const coinCurrencyID = req._coinCurrencyID;
  const exchangeID = req._exchangeID;

  try {
    result = await get(
      null,
      <number>coinCurrencyID,
      <number>exchangeID
    );
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  res.send({ result });

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}