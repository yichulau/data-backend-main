"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const async_1 = require("async");
const uuid_1 = require("uuid");
const cache_1 = __importDefault(require("../../../cache/cache.js"));
const volumeNotional_1 = require("../../../resource/volumeNotional.js");
const openInterest_1 = require("../../../resource/openInterest.js");
const expiry_1 = require("../../../resource/expiry.js");
const gamma_1 = require("../../../resource/gamma.js");
const deribit_1 = require("../../../service/deribit.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue) {
    const startTime = Date.now();
    let valueArr = [];
    try {
        const instruments = await _getInstruments();
        _assignStrikeAndExpiry(instruments, valueArr);
        await _assignRawOIAndVolume(valueArr);
        await _assignGammaValues(valueArr, btcSpotValue, ethSpotValue);
        await _insertGammaData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, btcNotionalVolume, ethNotionalVolume } = _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
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
async function _getInstruments() {
    let btcInstruments;
    let ethInstruments;
    try {
        btcInstruments = await (0, deribit_1.getInstruments)({ coinCurrency: "BTC" });
        ethInstruments = await (0, deribit_1.getInstruments)({ coinCurrency: "ETH" });
    }
    catch (err) {
        throw err;
    }
    return [...btcInstruments, ...ethInstruments];
}
function _assignStrikeAndExpiry(instruments, valueArr) {
    instruments.forEach(item => {
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
async function _assignRawOIAndVolume(valueArr) {
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
            value.tradingVolume = item.volume;
            value.openInterest = item.open_interest;
        }
        else if (item.base_currency === "ETH") {
            value.tradingVolume = item.volume;
            value.openInterest = item.open_interest;
        }
    });
    return;
}
async function _assignGammaValues(valueArr, btcSpotValue, ethSpotValue) {
    try {
        await (0, async_1.each)(valueArr, _iterate);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterate(i) {
        let tickerResult;
        const instrumentName = i.instrumentName;
        try {
            const existing = await cache_1.default.getDeribitTicker(instrumentName);
            if (existing) {
                i.lastPrice = existing.lastPrice;
                i.net = existing.net;
                i.bid = existing.bid;
                i.ask = existing.ask;
                i.vol = existing.vol;
                i.iv = existing.iv;
                i.delta = existing.delta;
                i.gamma = existing.gamma;
                return;
            }
        }
        catch (err) {
            console.log("deribit cache error");
            console.error(err);
        }
        do {
            try {
                tickerResult = await (0, deribit_1.getTicker)({ instrumentName });
            }
            catch (err) {
                if (err.response?.status !== 429) {
                    throw err;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } while (typeof tickerResult === "undefined");
        i.lastPrice = tickerResult.last_price || 0;
        i.net = tickerResult.stats.price_change || 0;
        i.bid = tickerResult.best_bid_price;
        i.ask = tickerResult.best_ask_price;
        i.vol = tickerResult.stats.volume || 0;
        i.iv = tickerResult.mark_iv;
        i.delta = tickerResult.greeks.delta;
        i.gamma = tickerResult.greeks.gamma;
        try {
            await cache_1.default.setDeribitTicker({
                instrumentName,
                lastPrice: i.lastPrice,
                net: i.net,
                bid: i.bid,
                ask: i.ask,
                vol: i.vol,
                iv: i.iv,
                delta: i.delta,
                gamma: i.gamma
            });
        }
        catch (err) {
            console.log("deribit cache error");
            console.error(err);
        }
        return;
    }
}
function _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue) {
    let btcOpenInterestSum = 0;
    let ethOpenInterestSum = 0;
    let btcNotionalVolume = 0;
    let ethNotionalVolume = 0;
    valueArr.forEach(item => {
        if (item.coinCurrencyID === common_1.CURRENCY_ID.BTC) {
            item.openInterest = item.openInterest * btcSpotValue;
            item.tradingVolume = item.tradingVolume * btcSpotValue;
            btcOpenInterestSum += item.openInterest;
            btcNotionalVolume += item.tradingVolume;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
            item.openInterest = item.openInterest * ethSpotValue;
            item.tradingVolume = item.tradingVolume * ethSpotValue;
            ethOpenInterestSum += item.openInterest;
            ethNotionalVolume += item.tradingVolume;
        }
    });
    return {
        btcOpenInterestSum,
        ethOpenInterestSum,
        btcNotionalVolume,
        ethNotionalVolume
    };
}
async function _insertGammaData(conn, valueArr, timestamp) {
    try {
        await (0, async_1.eachSeries)(valueArr, _iterateInsert);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        try {
            await (0, gamma_1.insert)(conn, common_1.EXCHANGE_ID.DERIBIT, (0, uuid_1.v4)(), item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.lastPrice, item.net, item.bid, item.ask, item.vol, item.tradingVolume, item.delta, item.gamma, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
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
