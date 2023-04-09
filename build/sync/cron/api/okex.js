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
const blockTrade_1 = require("../../../resource/blockTrade.js");
const gamma_1 = require("../../../resource/gamma.js");
const okex_1 = require("../../../service/okex.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue) {
    const startTime = Date.now();
    let instValueArr = [];
    let btValueArr = [];
    try {
        const tickers = await _getTickers();
        _assignNVValues(tickers, instValueArr, btcSpotValue, ethSpotValue);
        await _assignRawOI(instValueArr);
        await _assignGammaValues(tickers, instValueArr);
        await _insertGammaData(conn, instValueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, btcNotionalVolume, ethNotionalVolume } = _getOIAndNVSum(instValueArr, btcSpotValue, ethSpotValue);
        await _insertExpiryData(conn, instValueArr, syncTime);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
        const blockTrades = await _getBlockTrades();
        _assignBTValues(blockTrades, btValueArr);
        await _insertBlockTradeData(conn, btValueArr);
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
async function _getTickers() {
    let btcResult;
    let ethResult;
    try {
        btcResult = await (0, okex_1.getTicker)({ coinCurrencyPair: "BTC-USD" });
        ethResult = await (0, okex_1.getTicker)({ coinCurrencyPair: "ETH-USD" });
    }
    catch (err) {
        throw err;
    }
    return [...btcResult, ...ethResult];
}
function _assignNVValues(tickers, instValueArr, btcSpotValue, ethSpotValue) {
    tickers.forEach(item => {
        const symbol = item.instId;
        const symbolSplit = symbol.split("-");
        const coinCurrency = symbolSplit[0];
        const callOrPut = symbolSplit[4];
        const expiry = (0, moment_1.default)(symbolSplit[2], "YYMMDD").format(common_1.DATEFORMAT);
        const strike = Number(symbolSplit[3]);
        if (coinCurrency === "BTC") {
            instValueArr.push({
                coinCurrencyID: common_1.CURRENCY_ID.BTC,
                callOrPut,
                symbol,
                expiry,
                strike,
                tradingVolume: Number(item.volCcy24h) * btcSpotValue
            });
        }
        else if (coinCurrency === "ETH") {
            instValueArr.push({
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
async function _assignRawOI(instValueArr) {
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
        const val = instValueArr.find(i => i.symbol === item.instId);
        if (!val)
            return;
        val.openInterest = Number(item.oiCcy);
    });
    return;
}
async function _assignGammaValues(tickers, instValueArr) {
    let btcOptSummary;
    let ethOptSummary;
    let allOptSummary;
    try {
        btcOptSummary = await (0, okex_1.getOptionSummary)({ coinCurrencyPair: "BTC-USD" });
        ethOptSummary = await (0, okex_1.getOptionSummary)({ coinCurrencyPair: "ETH-USD" });
    }
    catch (err) {
        throw err;
    }
    allOptSummary = [...btcOptSummary, ...ethOptSummary];
    instValueArr.forEach(item => {
        const ticker = tickers.find(i => {
            return i.instId === item.symbol;
        });
        const optSummary = allOptSummary.find(i => {
            return i.instId === item.symbol;
        });
        item.lastPrice = Number(ticker.last);
        item.net = 0;
        item.bid = Number(ticker.bidPx);
        item.ask = Number(ticker.askPx);
        item.vol = Number(ticker.vol24h);
        item.iv = Number(optSummary?.markVol) || 0;
        item.delta = Number(optSummary?.deltaBS) || 0;
        item.gamma = Number(optSummary?.gammaBS) || 0;
    });
    return;
}
function _getOIAndNVSum(instValueArr, btcSpotValue, ethSpotValue) {
    let btcOpenInterestSum = 0;
    let ethOpenInterestSum = 0;
    let btcNotionalVolume = 0;
    let ethNotionalVolume = 0;
    instValueArr.forEach(item => {
        if (item.coinCurrencyID === common_1.CURRENCY_ID.BTC) {
            item.openInterest = item.openInterest * btcSpotValue;
            btcOpenInterestSum += item.openInterest;
            btcNotionalVolume += item.tradingVolume;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
            item.openInterest = item.openInterest * ethSpotValue;
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
async function _getBlockTrades() {
    try {
        const lastBlockTradeID = await cache_1.default.getOkexLastBlockTradeID();
        const result = await (0, okex_1.getBlockTrades)({
            beginID: lastBlockTradeID
        });
        return result;
    }
    catch (err) {
        throw err;
    }
}
function _assignBTValues(blockTrades, btValueArr) {
    blockTrades.forEach(blockTrade => {
        blockTrade.legs.forEach(leg => {
            btValueArr.push({
                blockTradeID: blockTrade.blockTdId,
                instrumentID: leg.instId,
                tradeID: BigInt(leg.tradeId),
                tradeTime: Math.floor(Number(blockTrade.cTime) / 1000),
                side: leg.side,
                price: Number(leg.px),
                size: Number(leg.sz),
                rawData: JSON.stringify(blockTrade)
            });
        });
    });
    return;
}
async function _insertGammaData(conn, instValueArr, timestamp) {
    try {
        await (0, async_1.eachSeries)(instValueArr, _iterateInsert);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        try {
            await (0, gamma_1.insert)(conn, common_1.EXCHANGE_ID.OKEX, (0, uuid_1.v4)(), item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.lastPrice, item.net, item.bid, item.ask, item.vol, item.iv, item.delta, item.gamma, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
async function _insertExpiryData(conn, instValueArr, timestamp) {
    try {
        await (0, async_1.eachSeries)(instValueArr, _iterateInsert);
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
async function _insertBlockTradeData(conn, btValueArr) {
    if (btValueArr.length === 0)
        return;
    let lastBlockTradeID = "0";
    try {
        await (0, async_1.eachSeries)(btValueArr, _iterateInsert);
        btValueArr.forEach(item => {
            if (item.blockTradeID > lastBlockTradeID) {
                lastBlockTradeID = item.blockTradeID;
            }
        });
        await cache_1.default.setOkexLastBlockTradeID(lastBlockTradeID);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        const coinCurrency = item.instrumentID.substring(0, 3);
        const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
        try {
            await (0, blockTrade_1.insertOkexBlockTrade)(conn, (0, uuid_1.v4)(), coinCurrencyID, item.blockTradeID, item.instrumentID, item.tradeID, item.tradeTime, item.side, item.price, item.size, item.rawData);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
