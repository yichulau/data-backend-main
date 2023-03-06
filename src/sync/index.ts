import dotenv from "dotenv";
dotenv.config();

import startCron from "./cron/index";

import startBinanceWS from "./websocket/binance";
import startBitcomWS from "./websocket/bitcom";
import startBybitWS from "./websocket/bybit";
import startDeribitWS from "./websocket/deribit";
import startOkexWS from "./websocket/okex";

console.log("data sync init");

startCron();

startBinanceWS();
startBitcomWS();
startBybitWS();
startDeribitWS();
startOkexWS();