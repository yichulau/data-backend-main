"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOIAndVolumeExpiry = exports.getOIAndVolumeStrike = exports.getMarkPrice = exports.getOptionSummary = exports.getTicker = exports.getOpenInterest = exports.getSpotValue = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("../common.js");
async function getSpotValue(currency) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.tickerIndexURL,
            params: {
                instId: currency
            }
        });
        if (data.code !== "0") {
            throw data;
        }
        return Number(data.data[0].idxPx);
    }
    catch (err) {
        throw err;
    }
}
exports.getSpotValue = getSpotValue;
async function getOpenInterest(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.openInterestURL,
            params: {
                instType: "OPTION",
                instFamily: params.coinCurrencyPair
            }
        });
        return data.data;
    }
    catch (err) {
        throw err;
    }
}
exports.getOpenInterest = getOpenInterest;
async function getTicker(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.tickerURL,
            params: {
                instType: "OPTION",
                instFamily: params.coinCurrencyPair
            }
        });
        return data.data;
    }
    catch (err) {
        throw err;
    }
}
exports.getTicker = getTicker;
async function getOptionSummary(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.optSummaryURL,
            params: {
                instFamily: params.coinCurrencyPair
            }
        });
        return data.data;
    }
    catch (err) {
        throw err;
    }
}
exports.getOptionSummary = getOptionSummary;
async function getMarkPrice(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.markPriceURL,
            params: {
                instType: "OPTION",
                instId: params.instrumentID
            }
        });
        return Number(data.data[0].markPx);
    }
    catch (err) {
        throw err;
    }
}
exports.getMarkPrice = getMarkPrice;
async function getOIAndVolumeStrike(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.oiAndVolumeStrikeURL,
            params: {
                ccy: params.coinCurrency,
                expTime: params.contractExpiry,
                period: "1D"
            }
        });
        return data.data;
    }
    catch (err) {
        throw err;
    }
}
exports.getOIAndVolumeStrike = getOIAndVolumeStrike;
async function getOIAndVolumeExpiry(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.okex.oiAndVolumeExpiryURL,
            params: {
                ccy: params.coinCurrency,
                period: "1D"
            }
        });
        return data.data;
    }
    catch (err) {
        throw err;
    }
}
exports.getOIAndVolumeExpiry = getOIAndVolumeExpiry;
