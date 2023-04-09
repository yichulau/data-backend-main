"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const async_1 = require("async");
const uuid_1 = require("uuid");
const volumeNotional_1 = require("../../../resource/volumeNotional.js");
const openInterest_1 = require("../../../resource/openInterest.js");
const expiry_1 = require("../../../resource/expiry.js");
const gamma_1 = require("../../../resource/gamma.js");
const bybit_1 = require("../../../service/bybit.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue, solSpotValue) {
    const startTime = Date.now();
    let valueArr = [];
    try {
        const btcTickers = await _getTickers("BTC");
        const ethTickers = await _getTickers("ETH");
        const solTickers = await _getTickers("SOL");
        const allTickers = [...btcTickers, ...ethTickers, ...solTickers];
        _assignValues(allTickers, valueArr);
        await _insertGammaData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, solOpenInterestSum, btcNotionalVolume, ethNotionalVolume, solNotionalVolume } = _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue, solSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.SOL, syncTime, solNotionalVolume);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.SOL, syncTime, solOpenInterestSum);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`bybit data sync completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("bybit data sync error");
        console.error(err);
    }
    return;
}
exports.default = default_1;
async function _getTickers(coinCurrency) {
    try {
        const result = await (0, bybit_1.getTicker)({ coinCurrency });
        return result;
    }
    catch (err) {
        throw err;
    }
}
function _assignValues(tickers, valueArr) {
    tickers.forEach(item => {
        let coinCurrencyID = 0;
        const symbol = item.symbol;
        const symbolSplit = symbol.split("-");
        const callOrPut = symbolSplit[3];
        const expiry = (0, moment_1.default)(symbolSplit[1], "DDMMMYYYY").format(common_1.DATEFORMAT);
        const strike = Number(symbolSplit[2]);
        switch (item.symbol.substring(0, 3)) {
            case "BTC":
                coinCurrencyID = common_1.CURRENCY_ID.BTC;
                break;
            case "ETH":
                coinCurrencyID = common_1.CURRENCY_ID.ETH;
                break;
            case "SOL":
                coinCurrencyID = common_1.CURRENCY_ID.SOL;
                break;
        }
        valueArr.push({
            coinCurrencyID,
            callOrPut,
            symbol,
            expiry,
            strike,
            tradingVolume: Number(item.turnover24h),
            openInterest: Number(item.openInterest),
            lastPrice: Number(item.lastPrice),
            net: Number(item.change24h),
            bid: Number(item.bid1Price),
            ask: Number(item.ask1Price),
            vol: Number(item.volume24h),
            iv: Number(item.markIv),
            delta: Number(item.delta),
            gamma: Number(item.gamma)
        });
    });
    return;
}
function _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue, solSpotValue) {
    let btcOpenInterestSum = 0;
    let ethOpenInterestSum = 0;
    let solOpenInterestSum = 0;
    let btcNotionalVolume = 0;
    let ethNotionalVolume = 0;
    let solNotionalVolume = 0;
    valueArr.forEach(item => {
        if (item.coinCurrencyID === common_1.CURRENCY_ID.BTC) {
            item.openInterest *= btcSpotValue;
            btcOpenInterestSum += item.openInterest;
            btcNotionalVolume += item.tradingVolume;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
            item.openInterest *= ethSpotValue;
            ethOpenInterestSum += item.openInterest;
            ethNotionalVolume += item.tradingVolume;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.SOL) {
            item.openInterest *= solSpotValue;
            solOpenInterestSum += item.openInterest;
            solNotionalVolume += item.tradingVolume;
        }
    });
    return {
        btcOpenInterestSum,
        ethOpenInterestSum,
        solOpenInterestSum,
        btcNotionalVolume,
        ethNotionalVolume,
        solNotionalVolume
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
            await (0, expiry_1.insert)(conn, common_1.EXCHANGE_ID.BYBIT, item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.tradingVolume, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
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
            await (0, gamma_1.insert)(conn, common_1.EXCHANGE_ID.BYBIT, (0, uuid_1.v4)(), item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.lastPrice, item.net, item.bid, item.ask, item.vol, item.iv, item.delta, item.gamma, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
async function _insertNotionalVolume(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, volumeNotional_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.BYBIT, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
async function _insertOpenInterest(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, openInterest_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.BYBIT, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
