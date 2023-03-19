"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contractsTraded_1 = require("../resource/contractsTraded.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
const common_1 = require("../common.js");
async function default_1(req, res, next) {
    let count24H = 0;
    let result24H = [];
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    try {
        switch (exchangeID) {
            case common_1.EXCHANGE_ID.BINANCE:
                count24H = await (0, contractsTraded_1.countRecentBinanceContracts)(null, "1day", coinCurrencyID);
                result24H = await (0, contractsTraded_1.getRecentBinanceContracts)(null, "1day", coinCurrencyID, 20);
                break;
            case common_1.EXCHANGE_ID.BITCOM:
                count24H = await (0, contractsTraded_1.countRecentBitcomContracts)(null, "1day", coinCurrencyID);
                result24H = await (0, contractsTraded_1.getRecentBitcomContracts)(null, "1day", coinCurrencyID, 20);
                break;
            case common_1.EXCHANGE_ID.BYBIT:
                count24H = await (0, contractsTraded_1.countRecentBybitContracts)(null, "1day", coinCurrencyID);
                result24H = await (0, contractsTraded_1.getRecentBybitContracts)(null, "1day", coinCurrencyID, 20);
                break;
            case common_1.EXCHANGE_ID.DERIBIT:
                count24H = await (0, contractsTraded_1.countRecentDeribitContracts)(null, "1day", coinCurrencyID);
                result24H = await (0, contractsTraded_1.getRecentDeribitContracts)(null, "1day", coinCurrencyID, 20);
                break;
            case common_1.EXCHANGE_ID.OKEX:
                count24H = await (0, contractsTraded_1.countRecentOkexContracts)(null, "1day", coinCurrencyID);
                result24H = await (0, contractsTraded_1.getRecentOkexContracts)(null, "1day", coinCurrencyID, 20);
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
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
