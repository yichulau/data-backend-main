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
const bitcom_1 = require("../../../service/bitcom.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue) {
    const startTime = Date.now();
    let valueArr = [];
    let btValueArr = [];
    try {
        const allInstruments = await _getInstruments();
        _assignStrikeAndExpiry(allInstruments, valueArr);
        await _assignOIAndVolume(valueArr);
        await _insertGammaData(conn, valueArr, syncTime);
        const { btcOpenInterestSum, ethOpenInterestSum, btcNotionalVolume, ethNotionalVolume } = _getOIAndNVSum(valueArr, btcSpotValue, ethSpotValue);
        await _insertExpiryData(conn, valueArr, syncTime);
        const marketTrades = await _getMarketTrades();
        _assignBTValues(marketTrades, btValueArr);
        await _insertBlockTradeData(conn, btValueArr);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.BTC, syncTime, btcNotionalVolume);
        await _insertNotionalVolume(conn, common_1.CURRENCY_ID.ETH, syncTime, ethNotionalVolume);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.BTC, syncTime, btcOpenInterestSum);
        await _insertOpenInterest(conn, common_1.CURRENCY_ID.ETH, syncTime, ethOpenInterestSum);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`bit.com data sync completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("bit.com data sync error");
        console.error(err);
    }
    return;
}
exports.default = default_1;
async function _getInstruments() {
    let result;
    try {
        result = await (0, bitcom_1.getInstruments)();
    }
    catch (err) {
        throw err;
    }
    result = result.filter(i => {
        return i.base_currency === "BTC" || i.base_currency === "ETH";
    });
    return result;
}
function _assignStrikeAndExpiry(instruments, valueArr) {
    instruments.forEach(item => {
        let coinCurrencyID = 0;
        const callOrPut = item.instrument_id.slice(-1);
        const expiry = (0, moment_1.default)(item.expiration_at).format(common_1.DATEFORMAT);
        if (item.base_currency === "BTC") {
            coinCurrencyID = common_1.CURRENCY_ID.BTC;
        }
        else if (item.base_currency === "ETH") {
            coinCurrencyID = common_1.CURRENCY_ID.ETH;
        }
        valueArr.push({
            existsInCache: false,
            coinCurrencyID,
            callOrPut,
            instrumentID: item.instrument_id,
            expiry,
            strike: Number(item.strike_price)
        });
    });
}
async function _assignOIAndVolume(valueArr) {
    try {
        await (0, async_1.each)(valueArr, _iterate);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterate(item) {
        let tickerResult;
        const instrumentID = item.instrumentID;
        try {
            const existing = await cache_1.default.getBitcomInstrument(instrumentID);
            if (existing) {
                item.existsInCache = true;
                item.openInterest = existing.openInterest;
                item.tradingVolume = existing.tradingVolume;
                item.lastPrice = existing.lastPrice;
                item.net = existing.net;
                item.bid = existing.bid;
                item.ask = existing.ask;
                item.vol = existing.vol;
                item.iv = existing.iv;
                item.delta = existing.delta;
                item.gamma = existing.gamma;
                return;
            }
        }
        catch (err) {
            console.log("cache error");
            console.error(err);
        }
        do {
            try {
                tickerResult = await (0, bitcom_1.getTicker)({ instrumentID });
            }
            catch (err) {
                if (err.response.status !== 429) {
                    throw err;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } while (typeof tickerResult === "undefined");
        item.openInterest = Number(tickerResult.open_interest);
        item.tradingVolume = Number(tickerResult.volume24h);
        item.lastPrice = Number(tickerResult.last_price);
        item.net = Number(tickerResult.price_change24h);
        item.bid = Number(tickerResult.best_bid);
        item.ask = Number(tickerResult.best_ask);
        item.vol = Number(tickerResult.volume24h);
        item.iv = Number(tickerResult.sigma);
        item.delta = Number(tickerResult.delta);
        item.gamma = Number(tickerResult.gamma);
        try {
            await cache_1.default.setBitcomInstrument({
                instrumentID: item.instrumentID,
                openInterest: item.openInterest,
                tradingVolume: item.tradingVolume,
                lastPrice: item.lastPrice,
                net: item.net,
                bid: item.bid,
                ask: item.ask,
                vol: item.vol,
                iv: item.iv,
                delta: item.delta,
                gamma: item.gamma
            });
        }
        catch (err) {
            console.log("bit.com cache error");
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
            btcOpenInterestSum += item.openInterest * btcSpotValue;
            btcNotionalVolume += item.tradingVolume * btcSpotValue;
        }
        else if (item.coinCurrencyID === common_1.CURRENCY_ID.ETH) {
            ethOpenInterestSum += item.openInterest * ethSpotValue;
            ethNotionalVolume += item.tradingVolume * ethSpotValue;
        }
    });
    return {
        btcOpenInterestSum,
        ethOpenInterestSum,
        btcNotionalVolume,
        ethNotionalVolume
    };
}
async function _getMarketTrades() {
    let btcTrades = [];
    let ethTrades = [];
    try {
        btcTrades = await (0, bitcom_1.getMarketTrades)({ coinCurrencyPair: "BTC-USD" });
        ethTrades = await (0, bitcom_1.getMarketTrades)({ coinCurrencyPair: "ETH-USD" });
    }
    catch (err) {
        throw err;
    }
    return [...btcTrades, ...ethTrades];
}
function _assignBTValues(marketTrades, btValueArr) {
    marketTrades.forEach(trade => {
        if (trade.is_block_trade) {
            btValueArr.push({
                blockTradeID: BigInt(trade.trade_id),
                instrumentID: trade.instrument_id,
                tradeID: BigInt(trade.trade_id),
                tradeTime: Math.floor(Number(trade.created_at) / 1000),
                side: trade.side,
                price: Number(trade.price),
                underlyingPrice: Number(trade.underlying_price),
                size: Number(trade.qty),
                sigma: Number(trade.sigma),
                rawData: JSON.stringify(trade)
            });
        }
    });
    return;
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
            await (0, gamma_1.insert)(conn, common_1.EXCHANGE_ID.BITCOM, (0, uuid_1.v4)(), item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.lastPrice, item.net, item.bid, item.ask, item.vol, item.iv, item.delta, item.gamma, item.openInterest);
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
            await (0, expiry_1.insert)(conn, common_1.EXCHANGE_ID.BITCOM, item.coinCurrencyID, timestamp, item.expiry, item.strike, item.callOrPut, item.tradingVolume, item.openInterest);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
async function _insertNotionalVolume(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, volumeNotional_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.BITCOM, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
async function _insertOpenInterest(conn, coinCurrencyID, timestamp, value) {
    try {
        await (0, openInterest_1.insert)(conn, coinCurrencyID, common_1.EXCHANGE_ID.BITCOM, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
async function _insertBlockTradeData(conn, btValueArr) {
    try {
        await (0, async_1.eachSeries)(btValueArr, _iterateInsert);
    }
    catch (err) {
        throw err;
    }
    return;
    async function _iterateInsert(item) {
        const coinCurrency = item.instrumentID.substring(0, 3);
        const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
        try {
            await (0, blockTrade_1.insertBitcomBlockTrade)(conn, (0, uuid_1.v4)(), coinCurrencyID, item.blockTradeID, item.instrumentID, item.tradeID, item.tradeTime, item.side, item.price, item.underlyingPrice, item.size, item.sigma, item.rawData);
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
