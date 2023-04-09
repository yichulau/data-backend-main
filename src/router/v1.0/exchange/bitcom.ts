import { Router } from "express";

import instrument from "@controller/instrument";
import instrumentDetails from "@controller/instrumentDetails";

import volumePremium from "@controller/volumePremium";
import volumeNotional from "@controller/volumeNotional";
import contractsTraded from "@controller/contractsTraded";
import openInterest from "@controller/openInterest";
import optionChart from "@controller/optionChart";
import blockTrade from "@controller/blockTrade";
import gamma from "@controller/gamma";

import { EXCHANGE_ID } from "common";

const router = Router();

router.use((req: IRequest, res: IResponse, next: INextFunction) => {
  req._exchangeID = EXCHANGE_ID.BITCOM;
  next();
});

router.get("/instrument", instrument);
router.get("/instrument/:instrumentName", instrumentDetails);

router.get("/volume-premium", volumePremium);
router.get("/volume-notional", volumeNotional);
router.get("/contracts-traded", contractsTraded);
router.get("/open-interest", openInterest);
router.get("/option-chart", optionChart);
router.get("/block-trade", blockTrade);
router.get("/gamma", gamma);

export default router;