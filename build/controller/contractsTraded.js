"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contractsTraded_1 = require("../resource/contractsTraded.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
const common_1 = require("../common.js");
async function default_1(req, res, next) {
    let result24H = [];
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    try {
        switch (exchangeID) {
            case common_1.EXCHANGE_ID.BINANCE:
                result24H = await (0, contractsTraded_1.getLast24HBinanceContracts)(null, coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.BITCOM:
                result24H = await (0, contractsTraded_1.getLast24HBitcomContracts)(null, coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.BYBIT:
                result24H = await (0, contractsTraded_1.getLast24HBybitContracts)(null, coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.DERIBIT:
                result24H = await (0, contractsTraded_1.getLast24HDeribitContracts)(null, coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.OKEX:
                result24H = await (0, contractsTraded_1.getLast24HOkexContracts)(null, coinCurrencyID);
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
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
