import { getLatestGammaData } from "@resource/gamma";

import logReqDuration from "helper/logReqDuration";

export default async function (req: IRequest, res: IResponse, next: INextFunction) {
  let gammaData: GammaData[] = [];

  const coinCurrencyID = <number>req._coinCurrencyID;
  const exchangeID = <number>req._exchangeID;

  try {
    gammaData = await getLatestGammaData(null, exchangeID, coinCurrencyID);
  }
  catch (err) {
    console.error(err);
    return next({
      status: 500
    });
  }

  res.send(gammaData);

  logReqDuration(<number>req._reqTime, <string>req._urlLog);
}