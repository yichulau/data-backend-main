"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenInterest = exports.getTickers = exports.getMarkPrice = exports.getIndexPrice = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("../common.js");
async function getIndexPrice(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.binance.indexPriceURL,
            params: {
                underlying: params.coinCurrencyPair
            }
        });
        return Number(data.indexPrice);
    }
    catch (err) {
        throw err;
    }
}
exports.getIndexPrice = getIndexPrice;
async function getMarkPrice(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.binance.markPriceURL,
            params: {
                symbol: params.instrumentID
            }
        });
        return data[0];
    }
    catch (err) {
        throw err;
    }
}
exports.getMarkPrice = getMarkPrice;
async function getTickers() {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.binance.tickerURL
        });
        return data;
    }
    catch (err) {
        throw err;
    }
}
exports.getTickers = getTickers;
async function getOpenInterest(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.binance.openInterestURL,
            params: {
                underlyingAsset: params.coinCurrency,
                expiration: params.expiration
            }
        });
        return data;
    }
    catch (err) {
        throw err;
    }
}
exports.getOpenInterest = getOpenInterest;
