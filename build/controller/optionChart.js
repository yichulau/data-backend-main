"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expiry_1 = require("../resource/expiry.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
async function default_1(req, res, next) {
    let result = {
        expiryData: [],
        strikeData: [],
        expiryList: [],
        strikeList: []
    };
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    const expiry = req.query.expiry;
    const strike = req.query.strike;
    try {
        const { expiryData, strikeData } = await (0, expiry_1.getLatestExpiryData)(null, exchangeID, coinCurrencyID, expiry, strike);
        result.expiryData = expiryData;
        result.strikeData = strikeData;
        result.expiryList = await (0, expiry_1.getExpiryDates)(null, exchangeID, coinCurrencyID);
        result.strikeList = await (0, expiry_1.getStrikes)(null, exchangeID, coinCurrencyID);
    }
    catch (err) {
        console.error(err);
        return next({
            status: 500
        });
    }
    res.send(result);
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
