import { Router } from "express";

import spotValue from "@controller/spotValue";

import all from "@router/v1.0/exchange/all";
import binance from "@router/v1.0/exchange/binance";
import bybit from "@router/v1.0/exchange/bybit";
import bitcom from "@router/v1.0/exchange/bitcom";
import deribit from "@router/v1.0/exchange/deribit";
import okex from "@router/v1.0/exchange/okex";

import { CURRENCY_ID } from "common";

const router = Router();

router.use((req: IRequest, res: IResponse, next: INextFunction) => {
  req._coinCurrencyID = CURRENCY_ID.BTC;
  next();
});

router.get("/spotval", spotValue);

router.use("/all", all);
router.use("/binance", binance);
router.use("/bybit", bybit);
router.use("/bit.com", bitcom);
router.use("/deribit", deribit);
router.use("/okex", okex);

export default router;