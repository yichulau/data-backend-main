"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const binance_1 = require("../service/binance.js");
const bitcom_1 = require("../service/bitcom.js");
const bybit_1 = require("../service/bybit.js");
const deribit_1 = require("../service/deribit.js");
const okex_1 = require("../service/okex.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
const common_1 = require("../common.js");
async function default_1(req, res, next) {
    let coinCurrency = "";
    let instruments = [];
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    switch (coinCurrencyID) {
        case common_1.CURRENCY_ID.BTC:
            coinCurrency = "BTC";
            break;
        case common_1.CURRENCY_ID.ETH:
            coinCurrency = "ETH";
            break;
        case common_1.CURRENCY_ID.SOL:
            coinCurrency = "SOL";
            break;
    }
    try {
        switch (exchangeID) {
            case common_1.EXCHANGE_ID.BINANCE:
                instruments = await _getBinanceSymbols(coinCurrency);
                break;
            case common_1.EXCHANGE_ID.BITCOM:
                instruments = await _getBitcomInstruments(coinCurrency);
                break;
            case common_1.EXCHANGE_ID.BYBIT:
                instruments = await _getBybitSymbols(coinCurrency);
                break;
            case common_1.EXCHANGE_ID.DERIBIT:
                instruments = await _getDeribitInstruments(coinCurrency);
                break;
            case common_1.EXCHANGE_ID.OKEX:
                instruments = await _getOkexInstruments(coinCurrency);
                break;
        }
    }
    catch (err) {
        console.error(err);
        return next({
            status: 500
        });
    }
    res.send(instruments);
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
async function _getBinanceSymbols(coinCurrency) {
    let result;
    let symbols = [];
    try {
        result = await (0, binance_1.getTickers)();
    }
    catch (err) {
        throw err;
    }
    symbols = result.map(i => i.symbol);
    symbols = symbols.filter(i => i.startsWith(coinCurrency));
    return symbols;
}
async function _getBitcomInstruments(coinCurrency) {
    let result;
    try {
        result = await (0, bitcom_1.getInstruments)();
    }
    catch (err) {
        throw err;
    }
    result = result
        .filter(i => i.base_currency === coinCurrency)
        .map(i => i.instrument_id);
    return result;
}
async function _getBybitSymbols(coinCurrency) {
    try {
        const result = await (0, bybit_1.getTicker)({ coinCurrency });
        return result.map(i => i.symbol);
    }
    catch (err) {
        throw err;
    }
}
async function _getDeribitInstruments(coinCurrency) {
    try {
        const result = await (0, deribit_1.getInstruments)({ coinCurrency });
        return result.map(i => i.instrument_name);
    }
    catch (err) {
        throw err;
    }
}
async function _getOkexInstruments(coinCurrency) {
    try {
        const result = await (0, okex_1.getTicker)({
            coinCurrencyPair: `${coinCurrency}-USD`
        });
        return result.map(i => i.instId);
    }
    catch (err) {
        throw err;
    }
}
