"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const blockTrade_1 = require("../resource/blockTrade.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
const common_1 = require("../common.js");
async function default_1(req, res, next) {
    let result = [];
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    try {
        switch (exchangeID) {
            case common_1.EXCHANGE_ID.BITCOM:
                result = await (0, blockTrade_1.getRecentBitcomBlockTrades)(null, "6hour", coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.BYBIT:
                result = await (0, blockTrade_1.getRecentBybitBlockTrades)(null, "6hour", coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.DERIBIT:
                result = await (0, blockTrade_1.getRecentDeribitBlockTrades)(null, "6hour", coinCurrencyID);
                break;
            case common_1.EXCHANGE_ID.OKEX:
                result = await (0, blockTrade_1.getRecentOkexBlockTrades)(null, "6hour", coinCurrencyID);
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
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
