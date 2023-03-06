"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("async");
const cache_1 = __importDefault(require("../../../cache/cache.js"));
const volumeNotional_1 = require("../../../resource/volumeNotional.js");
const openInterest_1 = require("../../../resource/openInterest.js");
const expiry_1 = require("../../../resource/expiry.js");
const binance_1 = require("../../../service/binance.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue) {
    const startTime = Date.now();
    try {
        const tickers = await _getTickers();
        const { btcNotionalVolume, ethNotionalVolume } = _getNotionalVolume(tickers, btcSpotValue, ethSpotValue);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
        const valueArr = _getValueArr(tickers);
        await _assignOpenInterestValues(valueArr);
        await _insertTradingVolumeData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum } = _getOpenInterestSum(valueArr);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`binance data sync completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("binance data sync error");
        console.error(err);
    }
    return;
}
exports.default = default_1;
async function _getTickers() {
    try {
        const result = await (0, binance_1.getTickers)();
        return result;
    }
    catch (err) {
        throw err;
    }
}
function _getNotionalVolume(tickers, btcSpotValue, ethSpotValue) {
    let btcNotionalVolume = 0;
    let ethNotionalVolume = 0;
    tickers.forEach(item => {
        if (item.symbol.startsWith("BTC")) {
            btcNotionalVolume += Number(item.volume) * btcSpotValue;
        }
        else if (item.symbol.startsWith("ETH")) {
            ethNotionalVolume += Number(item.volume) * ethSpotValue;
        }
    });
    return { btcNotionalVolume, ethNotionalVolume };
}
function _getValueArr(tickers) {
    let valueArr = [];
    tickers.forEach(item => {
        const symbol = item.symbol;
        const ccy = symbol.slice(0, 3);
        const expiry = symbol.slice(4, 10);
        const callOrPut = symbol.slice(-1);
        if (ccy === "BTC") {
            valueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.BTC,
                callOrPut,
                symbol,
                expiry,
                strike: Number(item.strikePrice),
                tradingVolume: Number(item.volume)
            });
        }
        else if (ccy === "ETH") {
            valueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.ETH,
                callOrPut,
                symbol,
                expiry,
                strike: Number(item.strikePrice),
                tradingVolume: Number(item.volume)
            });
        }
    });
    return valueArr;
}
async function _assignOpenInterestValues(valueArr) {
    try {
        await (0, async_1.eachSeries)(valueArr, _iterate);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterate(i) {
        try {
            const existing = await cache_1.default.getBinanceSymbol(i.symbol);
            if (existing) {
                i.openInterest = existing.openInterest;
                return;
            }
            const coinCurrency = i.symbol.slice(0, 3);
            const result = await (0, binance_1.getOpenInterest)({
                coinCurrency,
                expiration: i.expiry
            });
            await (0, async_1.eachSeries)(result, async (item) => {
                const openInterest = Number(item.sumOpenInterestUsd);
                i.openInterest = openInterest;
                try {
                    await cache_1.default.setBinanceSymbol({
                        symbol: i.symbol,
                        openInterest
                    });
                }
                catch (err) {
                    throw err;
                }
            });
            return;
        }
        catch (err) {
            throw err;
        }
    }
}
function _getOpenInterestSum(valueArr) {
    let btcOpenInterestSum = 0;
    let ethOpenInterestSum = 0;
    valueArr.forEach(item => {
        if (item.coinCurrencyID === common_1.CURRENCY_ID.BTC) {
            btcOpenInterestSum += item.openInterest;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
            ethOpenInterestSum += item.openInterest;
        }
    });
    return {
        btcOpenInterestSum,
        ethOpenInterestSum
    };
}
async function _insertNotionalVolume(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, volumeNotional_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.BINANCE, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
async function _insertTradingVolumeData(conn, valueArr, timestamp) {
    try {
        await (0, async_1.eachSeries)(valueArr, _iterateInsert);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        try {
            await (0, expiry_1.insert)(conn, common_1.EXCHANGE_ID.BINANCE, item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.tradingVolume, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
async function _insertOpenInterest(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, openInterest_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.BINANCE, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
