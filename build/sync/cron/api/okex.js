"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const async_1 = require("async");
const volumeNotional_1 = require("../../../resource/volumeNotional.js");
const openInterest_1 = require("../../../resource/openInterest.js");
const expiry_1 = require("../../../resource/expiry.js");
const okex_1 = require("../../../service/okex.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue) {
    const startTime = Date.now();
    let valueArr = [];
    try {
        const btcTickers = await _getTickers("BTC-USD");
        const ethTickers = await _getTickers("ETH-USD");
        const allTickers = [...btcTickers, ...ethTickers];
        _assignValues(allTickers, valueArr, btcSpotValue, ethSpotValue);
        await _assignOI(valueArr, btcSpotValue, ethSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, btcNotionalVolume, ethNotionalVolume } = _getOIAndNVSum(valueArr);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`okex data sync completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("okex data sync error");
        console.error(err);
    }
    return;
}
exports.default = default_1;
async function _getTickers(coinCurrencyPair) {
    try {
        const result = await (0, okex_1.getTicker)({ coinCurrencyPair });
        return result;
    }
    catch (err) {
        throw err;
    }
}
function _assignValues(tickers, valueArr, btcSpotValue, ethSpotValue) {
    tickers.forEach(item => {
        const symbol = item.instId;
        const symbolSplit = symbol.split("-");
        const coinCurrency = symbolSplit[0];
        const callOrPut = symbolSplit[4];
        const expiry = (0, moment_1.default)(symbolSplit[2], "YYMMDD").format(common_1.DATEFORMAT);
        const strike = Number(symbolSplit[3]);
        if (coinCurrency === "BTC") {
            valueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.BTC,
                callOrPut,
                symbol,
                expiry,
                strike,
                tradingVolume: Number(item.volCcy24h) * btcSpotValue
            });
        }
        else if (coinCurrency === "ETH") {
            valueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.ETH,
                callOrPut,
                symbol,
                expiry,
                strike,
                tradingVolume: Number(item.volCcy24h) * ethSpotValue
            });
        }
    });
    return;
}
async function _assignOI(valueArr, btcSpotValue, ethSpotValue) {
    let btcResult = [];
    let ethResult = [];
    let combinedResults = [];
    try {
        btcResult = await (0, okex_1.getOpenInterest)({ coinCurrencyPair: "BTC-USD" });
        ethResult = await (0, okex_1.getOpenInterest)({ coinCurrencyPair: "ETH-USD" });
    }
    catch (err) {
        throw err;
    }
    combinedResults = [...btcResult, ...ethResult];
    combinedResults.forEach(item => {
        const value = valueArr.find(i => {
            return i.symbol === item.instId;
        });
        if (!value)
            return;
        const coinCurrency = item.instId.slice(0, 3);
        if (coinCurrency === "BTC") {
            value.openInterest = Number(item.oiCcy) * btcSpotValue;
        }
        else {
            value.openInterest = Number(item.oiCcy) * ethSpotValue;
        }
    });
    return;
}
function _getOIAndNVSum(valueArr) {
    let btcOpenInterestSum = 0;
    let ethOpenInterestSum = 0;
    let btcNotionalVolume = 0;
    let ethNotionalVolume = 0;
    valueArr.forEach(item => {
        const OI = item.openInterest;
        const vol = item.tradingVolume;
        if (item.coinCurrencyID === common_1.CURRENCY_ID.BTC) {
            btcOpenInterestSum += OI;
            btcNotionalVolume += vol;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
            ethOpenInterestSum += OI;
            ethNotionalVolume += vol;
        }
    });
    return {
        btcOpenInterestSum,
        ethOpenInterestSum,
        btcNotionalVolume,
        ethNotionalVolume
    };
}
async function _insertExpiryData(conn, valueArr, timestamp) {
    try {
        await (0, async_1.eachSeries)(valueArr, _iterateInsert);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        try {
            await (0, expiry_1.insert)(conn, common_1.EXCHANGE_ID.OKEX, item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.tradingVolume, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
async function _insertNotionalVolume(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, volumeNotional_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.OKEX, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
async function _insertOpenInterest(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, openInterest_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.OKEX, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
