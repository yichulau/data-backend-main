"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const common_1 = require("../common.js");
const redis = new ioredis_1.default();
exports.default = {
    getBinanceSymbol,
    setBinanceSymbol,
    getBitcomInstrument,
    setBitcomInstrument,
    getOkexLastBlockTradeID,
    setOkexLastBlockTradeID
};
async function getBinanceSymbol(symbol) {
    try {
        const result = await redis.get(`${common_1.binanceSymbolCachePrefix}${symbol}`);
        if (!result)
            return undefined;
        return JSON.parse(result);
    }
    catch (err) {
        throw err;
    }
}
async function setBinanceSymbol(obj) {
    try {
        await redis.setex(`${common_1.binanceSymbolCachePrefix}${obj.symbol}`, common_1.binanceSymbolCacheExpirySecs, JSON.stringify(obj));
    }
    catch (err) {
        throw err;
    }
    return;
}
async function getBitcomInstrument(instrumentID) {
    try {
        const result = await redis.get(`${common_1.bitcomInstrumentCachePrefix}${instrumentID}`);
        if (!result)
            return undefined;
        return JSON.parse(result);
    }
    catch (err) {
        throw err;
    }
}
async function setBitcomInstrument(obj) {
    try {
        await redis.setex(`${common_1.bitcomInstrumentCachePrefix}${obj.instrumentID}`, common_1.bitcomInstrumentCacheExpirySecs, JSON.stringify(obj));
    }
    catch (err) {
        throw err;
    }
    return;
}
async function getOkexLastBlockTradeID() {
    try {
        const result = await redis.get(common_1.okexLastBlockTradeIDKey);
        if (!result)
            return undefined;
        return result;
    }
    catch (err) {
        throw err;
    }
}
async function setOkexLastBlockTradeID(blockTradeID) {
    try {
        await redis.set(common_1.okexLastBlockTradeIDKey, blockTradeID);
    }
    catch (err) {
        throw err;
    }
    return;
}
