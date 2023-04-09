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
        await _assignOIAndGammaValues(valueArr);
        await _insertGammaData(conn, valueArr, syncTime, btcSpotValue, ethSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
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
        const obj = {
            existsInCache: false,
            callOrPut,
            symbol,
            expiry,
            strike: Number(item.strikePrice),
            tradingVolume: Number(item.volume),
            lastPrice: Number(item.lastPrice),
            net: Number(item.priceChangePercent),
            bid: Number(item.bidPrice),
            ask: Number(item.askPrice)
        };
        if (ccy === "BTC") {
            valueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.BTC,
                ...obj
            });
        }
        else if (ccy === "ETH") {
            valueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.ETH,
                ...obj
            });
        }
    });
    return valueArr;
}
async function _assignOIAndGammaValues(valueArr) {
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
                i.existsInCache = true;
                i.openInterest = existing.openInterest;
                i.iv = existing.iv;
                i.delta = existing.delta;
                i.gamma = existing.gamma;
                return;
            }
        }
        catch (err) {
            console.log("binance cache error");
            console.error(err);
        }
        try {
            const oiResult = await (0, binance_1.getOpenInterest)({
                coinCurrency: i.symbol.slice(0, 3),
                expiration: i.expiry
            });
            const res = oiResult.find(o => o.symbol === i.symbol);
            i.openInterest = Number(res?.sumOpenInterestUsd) || 0;
        }
        catch (err) {
            if (err.response?.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return await _iterate(i);
            }
            console.log("binance open interest error");
            throw err;
        }
        try {
            const mpResult = await (0, binance_1.getMarkPrice)({ instrumentID: i.symbol });
            i.iv = Number(mpResult.markIV);
            i.delta = Number(mpResult.delta);
            i.gamma = Number(mpResult.gamma);
        }
        catch (err) {
            if (err.response?.data?.code === -1121) {
                i.iv = null;
                i.delta = null;
                i.gamma = null;
            }
            else if (err.response?.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return await _iterate(i);
            }
            else {
                console.log("binance mark price error");
                throw err;
            }
        }
        if (i.existsInCache)
            return;
        try {
            await cache_1.default.setBinanceSymbol({
                symbol: i.symbol,
                openInterest: i.openInterest,
                iv: i.iv,
                delta: i.delta,
                gamma: i.gamma
            });
        }
        catch (err) {
            console.log("binance cache error");
            console.error(err);
        }
        return;
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
async function _insertGammaData(conn, valueArr, timestamp, btcSpotValue, ethSpotValue) {
    try {
        await (0, async_1.eachSeries)(valueArr, _iterateInsert);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        if (typeof item.iv !== "number")
            return;
        try {
            if (item.coinCurrencyID === common_1.CURRENCY_ID.BTC) {
                await (0, gamma_1.insert)(conn, common_1.EXCHANGE_ID.BINANCE, (0, uuid_1.v4)(), item.coinCurrencyID, timestamp, (0, moment_1.default)(item.expiry, "YYMMDD").format(common_1.DATEFORMAT), item.strike, item.callOrPut, item.lastPrice, item.net, item.bid, item.ask, item.tradingVolume, item.iv, item.delta, item.gamma, item.openInterest / btcSpotValue);
            }
            else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
                await (0, gamma_1.insert)(conn, common_1.EXCHANGE_ID.BINANCE, (0, uuid_1.v4)(), item.coinCurrencyID, timestamp, (0, moment_1.default)(item.expiry, "YYMMDD").format(common_1.DATEFORMAT), item.strike, item.callOrPut, item.lastPrice, item.net, item.bid, item.ask, item.tradingVolume, item.iv, item.delta, item.gamma, item.openInterest / ethSpotValue);
            }
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
            await (0, expiry_1.insert)(conn, common_1.EXCHANGE_ID.BINANCE, item.coinCurrencyID, timestamp, (0, moment_1.default)(item.expiry, "YYMMDD").format(common_1.DATEFORMAT), item.strike, item.callOrPut, item.tradingVolume, item.openInterest);
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
