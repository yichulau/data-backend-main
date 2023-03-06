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
const deribit_1 = require("../../../service/deribit.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue) {
    const startTime = Date.now();
    let valueArr = [];
    try {
        await _assignStrikeAndExpiry(valueArr);
        await _assignOIAndVolume(valueArr, btcSpotValue, ethSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, btcNotionalVolume, ethNotionalVolume } = _getOIAndNVSum(valueArr);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`deribit data sync completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("deribit data sync error");
        console.error(err);
    }
    return;
}
exports.default = default_1;
async function _assignStrikeAndExpiry(valueArr) {
    let btcResult = [];
    let ethResult = [];
    let combinedResults = [];
    try {
        btcResult = await (0, deribit_1.getInstruments)({ coinCurrency: "BTC" });
        ethResult = await (0, deribit_1.getInstruments)({ coinCurrency: "ETH" });
    }
    catch (err) {
        throw err;
    }
    combinedResults = [...btcResult, ...ethResult];
    combinedResults.forEach(item => {
        let coinCurrencyID = 0;
        const callOrPut = item.instrument_name.slice(-1);
        const expiry = (0, moment_1.default)(item.expiration_timestamp).format(common_1.DATEFORMAT);
        if (item.base_currency === "BTC") {
            coinCurrencyID = common_1.CURRENCY_ID.BTC;
        }
        else if (item.base_currency === "ETH") {
            coinCurrencyID = common_1.CURRENCY_ID.ETH;
        }
        valueArr.push({
            coinCurrencyID,
            callOrPut,
            instrumentName: item.instrument_name,
            expiry,
            strike: item.strike
        });
    });
    return;
}
async function _assignOIAndVolume(valueArr, btcSpotValue, ethSpotValue) {
    let btcResult = [];
    let ethResult = [];
    let combinedResults = [];
    try {
        btcResult = await (0, deribit_1.getBookSummaryByCurrency)({ coinCurrency: "BTC" });
        ethResult = await (0, deribit_1.getBookSummaryByCurrency)({ coinCurrency: "ETH" });
    }
    catch (err) {
        throw err;
    }
    combinedResults = [...btcResult, ...ethResult];
    combinedResults.forEach(item => {
        const value = valueArr.find(i => {
            return i.instrumentName === item.instrument_name;
        });
        if (item.base_currency === "BTC") {
            value.tradingVolume = item.volume * btcSpotValue;
            value.openInterest = item.open_interest * btcSpotValue;
        }
        else if (item.base_currency === "ETH") {
            value.tradingVolume = item.volume * ethSpotValue;
            value.openInterest = item.open_interest * ethSpotValue;
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
            await (0, expiry_1.insert)(conn, common_1.EXCHANGE_ID.DERIBIT, item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.tradingVolume, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
async function _insertNotionalVolume(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, volumeNotional_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.DERIBIT, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
async function _insertOpenInterest(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, openInterest_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.DERIBIT, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
