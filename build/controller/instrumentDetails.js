"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const binance = __importStar(require("../service/binance.js"));
const bitcom = __importStar(require("../service/bitcom.js"));
const bybit = __importStar(require("../service/bybit.js"));
const deribit = __importStar(require("../service/deribit.js"));
const okex = __importStar(require("../service/okex.js"));
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
const common_1 = require("../common.js");
async function default_1(req, res, next) {
    let instrumentDetails = null;
    let coinCurrency = "";
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    const instrumentName = req.params.instrumentName;
    switch (coinCurrencyID) {
        case common_1.CURRENCY_ID.BTC:
            coinCurrency = "BTC";
            break;
        case common_1.CURRENCY_ID.ETH:
            coinCurrency = "ETH";
            break;
        case common_1.CURRENCY_ID.SOL:
            coinCurrency = "SOL";
            break;
    }
    if (instrumentName.slice(0, 3) !== coinCurrency) {
        return next({
            status: 404
        });
    }
    try {
        switch (exchangeID) {
            case common_1.EXCHANGE_ID.BINANCE:
                instrumentDetails = await _getBinanceInstrumentDetails(coinCurrency, req._reqTime, instrumentName);
                break;
            case common_1.EXCHANGE_ID.BITCOM:
                instrumentDetails = await _getBitcomInstrumentDetails(coinCurrency, req._reqTime, instrumentName);
                break;
            case common_1.EXCHANGE_ID.BYBIT:
                instrumentDetails = await _getBybitInstrumentDetails(coinCurrency, req._reqTime, instrumentName);
                break;
            case common_1.EXCHANGE_ID.DERIBIT:
                instrumentDetails = await _getDeribitInstrumentDetails(req._reqTime, instrumentName);
                break;
            case common_1.EXCHANGE_ID.OKEX:
                instrumentDetails = await _getOkexInstrumentDetails(coinCurrency, req._reqTime, instrumentName);
                break;
        }
    }
    catch (err) {
        console.error(err);
        return next({
            status: 500
        });
    }
    if (instrumentDetails === null) {
        next({
            status: 400
        });
    }
    else {
        res.send(instrumentDetails);
    }
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
async function _getBinanceInstrumentDetails(coinCurrency, timestamp, instrumentName) {
    let indexPrice = 0;
    let instResult, oiResult, mpResult;
    try {
        indexPrice = await binance.getIndexPrice({
            coinCurrencyPair: `${coinCurrency}USDT`
        });
        instResult = await binance.getTickers();
        oiResult = await binance.getOpenInterest({
            coinCurrency,
            expiration: instrumentName.slice(4, 10)
        });
    }
    catch (err) {
        throw err;
    }
    const instDetails = instResult.find(i => i.symbol === instrumentName);
    const oiDetails = oiResult.find(i => i.symbol === instrumentName);
    if (!instDetails || !oiDetails)
        return null;
    try {
        mpResult = await binance.getMarkPrice({ instrumentID: instrumentName });
    }
    catch (err) {
        throw err;
    }
    return {
        timestamp,
        instrumentName,
        underlyingName: instDetails.symbol.slice(0, 10),
        callOrPut: instDetails.symbol.slice(-1),
        expiry: (0, moment_1.default)(instrumentName.slice(4, 10), "YYMMDD").format(common_1.DATEFORMAT),
        strike: Number(instDetails.strikePrice),
        indexPrice,
        markPrice: Number(mpResult.markPrice),
        vega: Number(mpResult.vega),
        theta: Number(mpResult.theta),
        rho: null,
        gamma: Number(mpResult.gamma),
        delta: Number(mpResult.delta),
        underlyingPrice: null,
        price: Number(instDetails.askPrice),
        lastPrice: Number(instDetails.lastPrice),
        high24h: Number(instDetails.high),
        low24h: Number(instDetails.low),
        priceChange24h: Number(instDetails.priceChange),
        volume24h: Number(instDetails.volume),
        openInterest: Number(oiDetails.sumOpenInterestUsd),
        markIv: Number(mpResult.markIV)
    };
}
async function _getBitcomInstrumentDetails(coinCurrency, timestamp, instrumentName) {
    let instResult, tickerResult;
    try {
        instResult = await bitcom.getInstruments();
        tickerResult = await bitcom.getTicker({
            instrumentID: instrumentName
        });
    }
    catch (err) {
        throw err;
    }
    const instDetails = instResult
        .filter(i => i.base_currency === coinCurrency)
        .find(i => i.instrument_id === instrumentName);
    if (!instDetails)
        return null;
    return {
        timestamp,
        instrumentName,
        underlyingName: tickerResult.underlying_name,
        callOrPut: instrumentName.slice(-1),
        expiry: (0, moment_1.default)(instDetails.expiration_at).format(common_1.DATEFORMAT),
        strike: Number(instDetails.strike_price),
        indexPrice: Number(tickerResult.index_price),
        markPrice: Number(tickerResult.mark_price),
        vega: Number(tickerResult.vega),
        theta: Number(tickerResult.theta),
        rho: null,
        gamma: Number(tickerResult.gamma),
        delta: Number(tickerResult.delta),
        underlyingPrice: Number(tickerResult.underlying_price),
        price: null,
        lastPrice: Number(tickerResult.last_price),
        high24h: Number(tickerResult.high24h),
        low24h: Number(tickerResult.low24h),
        priceChange24h: Number(tickerResult.price_change24h),
        volume24h: Number(tickerResult.volume24h),
        openInterest: Number(tickerResult.open_interest) * Number(tickerResult.index_price),
        markIv: null
    };
}
async function _getBybitInstrumentDetails(coinCurrency, timestamp, instrumentName) {
    let tickerResult;
    try {
        tickerResult = await bybit.getTicker({ coinCurrency });
    }
    catch (err) {
        throw err;
    }
    const tickerDetails = tickerResult.find(i => i.symbol === instrumentName);
    if (!tickerDetails)
        return null;
    const instNameSplit = instrumentName.split("-");
    const underlyingName = instNameSplit[0].concat("-", instNameSplit[1]);
    const expiry = (0, moment_1.default)(instNameSplit[1], "DDMMMYY").format(common_1.DATEFORMAT);
    const strike = Number(instNameSplit[2]);
    return {
        timestamp,
        instrumentName,
        underlyingName,
        callOrPut: instrumentName.slice(-1),
        expiry,
        strike,
        indexPrice: Number(tickerDetails.indexPrice),
        markPrice: Number(tickerDetails.markPrice),
        vega: Number(tickerDetails.vega),
        theta: Number(tickerDetails.theta),
        rho: null,
        gamma: Number(tickerDetails.gamma),
        delta: Number(tickerDetails.delta),
        underlyingPrice: Number(tickerDetails.underlyingPrice),
        price: null,
        lastPrice: Number(tickerDetails.lastPrice),
        high24h: Number(tickerDetails.highPrice24h),
        low24h: Number(tickerDetails.lowPrice24h),
        priceChange24h: null,
        volume24h: Number(tickerDetails.volume24h),
        openInterest: Number(tickerDetails.openInterest) * Number(tickerDetails.indexPrice),
        markIv: Number(tickerDetails.markIv)
    };
}
async function _getDeribitInstrumentDetails(timestamp, instrumentName) {
    let tickerResult;
    try {
        tickerResult = await deribit.getTicker({ instrumentName });
    }
    catch (err) {
        throw err;
    }
    const instNameSplit = instrumentName.split("-");
    const expiry = (0, moment_1.default)(instNameSplit[1], "DDMMMYY").format(common_1.DATEFORMAT);
    const strike = Number(instNameSplit[2]);
    return {
        timestamp,
        instrumentName,
        underlyingName: tickerResult.underlying_index,
        callOrPut: instrumentName.slice(-1),
        expiry,
        strike,
        indexPrice: tickerResult.index_price,
        markPrice: tickerResult.mark_price,
        vega: tickerResult.greeks.vega,
        theta: tickerResult.greeks.theta,
        rho: tickerResult.greeks.rho,
        gamma: tickerResult.greeks.gamma,
        delta: tickerResult.greeks.delta,
        underlyingPrice: tickerResult.underlying_price,
        price: null,
        lastPrice: tickerResult.last_price,
        high24h: tickerResult.stats.high,
        low24h: tickerResult.stats.low,
        priceChange24h: tickerResult.stats.price_change,
        volume24h: tickerResult.stats.volume,
        openInterest: tickerResult.open_interest,
        markIv: tickerResult.mark_iv
    };
}
async function _getOkexInstrumentDetails(coinCurrency, timestamp, instrumentName) {
    let indexPrice, tickerResult, oiResult, optSummaryResult, markPrice;
    const coinCurrencyPair = `${coinCurrency}-USD`;
    try {
        indexPrice = await okex.getSpotValue(`${coinCurrencyPair}T`);
        tickerResult = await okex.getTicker({ coinCurrencyPair });
        oiResult = await okex.getOpenInterest({ coinCurrencyPair });
        optSummaryResult = await okex.getOptionSummary({ coinCurrencyPair });
        markPrice = await okex.getMarkPrice({ instrumentID: instrumentName });
    }
    catch (err) {
        throw err;
    }
    const tickerDetails = tickerResult.find(i => i.instId === instrumentName);
    const oiDetails = oiResult.find(i => i.instId === instrumentName);
    const optionDetails = optSummaryResult.find(i => i.instId === instrumentName);
    if (!tickerDetails || !oiDetails || !optionDetails)
        return null;
    const instNameSplit = instrumentName.split("-");
    const expiry = (0, moment_1.default)(instNameSplit[2], "YYMMDD").format(common_1.DATEFORMAT);
    const strike = Number(instNameSplit[3]);
    return {
        timestamp,
        instrumentName,
        underlyingName: instrumentName.slice(0, 14),
        callOrPut: instrumentName.slice(-1),
        expiry,
        strike,
        indexPrice,
        markPrice,
        vega: Number(optionDetails.vega),
        theta: Number(optionDetails.theta),
        rho: null,
        gamma: Number(optionDetails.gamma),
        delta: Number(optionDetails.delta),
        underlyingPrice: null,
        price: Number(tickerDetails.askPx),
        lastPrice: Number(tickerDetails.last) || 0,
        high24h: Number(tickerDetails.high24h) || 0,
        low24h: Number(tickerDetails.low24h) || 0,
        priceChange24h: null,
        volume24h: Number(tickerDetails.volCcy24h) || 0,
        openInterest: Number(oiDetails.oiCcy) * indexPrice,
        markIv: null
    };
}
