"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const okex_1 = require("../service/okex.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
async function default_1(req, res, next) {
    let spotValue = 0;
    let coinCurrency = "";
    const coinCurrencyID = req._coinCurrencyID;
    switch (coinCurrencyID) {
        case 1:
            coinCurrency = "BTC-USD";
            break;
        case 2:
            coinCurrency = "ETH-USD";
            break;
        case 3:
            coinCurrency = "SOL-USD";
            break;
    }
    try {
        spotValue = await _getSpotValue(coinCurrency);
    }
    catch (err) {
        console.error(err);
        return next({
            status: 500
        });
    }
    res.send({ spotValue });
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
async function _getSpotValue(coinCurrency) {
    try {
        return await (0, okex_1.getSpotValue)(coinCurrency);
    }
    catch (err) {
        throw err;
    }
}
