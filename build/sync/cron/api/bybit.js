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
        _assignValues(allTickers, valueArr, btcSpotValue, ethSpotValue, solSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, solOpenInterestSum, btcNotionalVolume, ethNotionalVolume, solNotionalVolume } = _getOIAndNVSum(valueArr);
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
function _assignValues(tickers, valueArr, btcSpotValue, ethSpotValue, solSpotValue) {
    tickers.forEach(item => {
        let coinCurrencyID = 0;
        let openInterest = 0;
        const symbol = item.symbol;
        const symbolSplit = symbol.split("-");
        const coinCurrency = symbolSplit[0];
        const callOrPut = symbolSplit[3];
        const expiry = (0, moment_1.default)(symbolSplit[1], "DDMMMYYYY").format(common_1.DATEFORMAT);
        const strike = Number(symbolSplit[2]);
        switch (coinCurrency) {
            case "BTC":
                coinCurrencyID = common_1.CURRENCY_ID.BTC;
                openInterest = Number(item.openInterest) * btcSpotValue;
                break;
            case "ETH":
                coinCurrencyID = common_1.CURRENCY_ID.ETH;
                openInterest = Number(item.openInterest) * ethSpotValue;
                break;
            case "SOL":
                coinCurrencyID = common_1.CURRENCY_ID.SOL;
                openInterest = Number(item.openInterest) * solSpotValue;
                break;
        }
        valueArr.push({
            coinCurrencyID,
            callOrPut,
            symbol,
            expiry,
            strike,
            tradingVolume: Number(item.turnover24h),
            openInterest
        });
    });
    return;
}
function _getOIAndNVSum(valueArr) {
    let btcOpenInterestSum = 0;
    let ethOpenInterestSum = 0;
    let solOpenInterestSum = 0;
    let btcNotionalVolume = 0;
    let ethNotionalVolume = 0;
    let solNotionalVolume = 0;
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
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.SOL) {
            solOpenInterestSum += OI;
            solNotionalVolume += vol;
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
