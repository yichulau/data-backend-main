"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldData = exports.insert = exports.getLatestGammaData = void 0;
const moment_1 = __importDefault(require("moment"));
const db_1 = __importDefault(require("../database/db.js"));
const common_1 = require("../common.js");
async function getLatestGammaData(conn, exchangeID, coinCurrencyID) {
    let result;
    try {
        result = await _query(conn, exchangeID, coinCurrencyID);
    }
    catch (err) {
        throw err;
    }
    return _formatGammaData(result);
    async function _query(conn, exchangeID, coinCurrencyID) {
        let res;
        const tableName = _getTableName(exchangeID);
        const query = `
      SELECT
        coinCurrencyID,
        expiry,
        strike,
        callOrPut,
        lastPrice,
        net,
        bid,
        ask,
        vol,
        iv,
        delta,
        gamma,
        openInterest
      FROM
        ${tableName}
      WHERE
        coinCurrencyID = ?
        AND
        ts = (SELECT ts FROM ${tableName} ORDER BY ts DESC LIMIT 1);
    `;
        const data = [
            coinCurrencyID
        ];
        try {
            if (conn) {
                res = await conn.query(query, data);
            }
            else {
                res = await db_1.default.query(query, data);
            }
        }
        catch (err) {
            throw err;
        }
        res[0].forEach((item) => {
            item.expiry = (0, moment_1.default)(item.expiry).format(common_1.DATEFORMAT);
            item.lastPrice = Number(item.lastPrice);
            item.net = Number(item.net);
            item.bid = Number(item.bid);
            item.ask = Number(item.ask);
            item.vol = Number(item.vol);
            item.iv = Number(item.iv);
            item.delta = Number(item.delta);
            item.gamma = Number(item.gamma);
            item.openInterest = Number(item.openInterest);
        });
        return res[0];
    }
}
exports.getLatestGammaData = getLatestGammaData;
async function insert(conn, exchangeID, ID, coinCurrencyID, ts, expiry, strike, callOrPut, lastPrice, net, bid, ask, vol, iv, delta, gamma, openInterest) {
    const query = `
    INSERT INTO ${_getTableName(exchangeID)}
      (ID, coinCurrencyID, ts, expiry, strike,
      callOrPut, lastPrice, net, bid, ask, vol,
      iv, delta, gamma, openInterest)
    VALUES
      (?, ?, FROM_UNIXTIME(?), ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?);
  `;
    const data = [
        ID,
        coinCurrencyID,
        ts,
        expiry,
        strike,
        callOrPut,
        lastPrice,
        net,
        bid,
        ask,
        vol,
        iv,
        delta,
        gamma,
        openInterest
    ];
    try {
        if (conn) {
            await conn.query(query, data);
        }
        else {
            await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    return;
}
exports.insert = insert;
async function deleteOldData(conn, exchangeID) {
    const query = `
    DELETE FROM ${_getTableName(exchangeID)}
    WHERE ts <= NOW() - INTERVAL 2 HOUR;
  `;
    try {
        await conn.query(query, []);
    }
    catch (err) {
        throw err;
    }
    return;
}
exports.deleteOldData = deleteOldData;
function _getTableName(exchangeID) {
    switch (exchangeID) {
        case common_1.EXCHANGE_ID.BINANCE: return "Gamma_Binance";
        case common_1.EXCHANGE_ID.BITCOM: return "Gamma_Bitcom";
        case common_1.EXCHANGE_ID.BYBIT: return "Gamma_Bybit";
        case common_1.EXCHANGE_ID.DERIBIT: return "Gamma_Deribit";
        case common_1.EXCHANGE_ID.OKEX: return "Gamma_Okex";
        default: return "";
    }
}
function _formatGammaData(data) {
    let gammaData = [];
    const allExpiry = [...new Set(data.map(i => i.expiry))];
    allExpiry.forEach(expiry => {
        if (gammaData.find(i => i.expiry === expiry))
            return;
        gammaData.push({
            expiry,
            data: []
        });
        const lastInsertedGammaDetail = gammaData[gammaData.length - 1];
        const sameExpiryValues = data.filter(i => i.expiry === expiry);
        sameExpiryValues.forEach((val) => {
            const strike = val.strike;
            const callOrPut = val.callOrPut;
            const expData = lastInsertedGammaDetail.data.find(i => {
                return i.strike === strike;
            });
            if (expData) {
                if (callOrPut === "C") {
                    expData.callLastPrice = val.lastPrice;
                    expData.callNet = val.net;
                    expData.callBid = val.bid;
                    expData.callAsk = val.ask;
                    expData.callVol = val.vol;
                    expData.callIV = val.iv;
                    expData.callDelta = val.delta;
                    expData.callGamma = val.gamma;
                    expData.callOpenInterest = val.openInterest;
                }
                else {
                    expData.putLastPrice = val.lastPrice;
                    expData.putNet = val.net;
                    expData.putBid = val.bid;
                    expData.putAsk = val.ask;
                    expData.putVol = val.vol;
                    expData.putIV = val.iv;
                    expData.putDelta = val.delta;
                    expData.putGamma = val.gamma;
                    expData.putOpenInterest = val.openInterest;
                }
            }
            else {
                if (callOrPut === "C") {
                    lastInsertedGammaDetail.data.push({
                        strike,
                        callLastPrice: val.lastPrice,
                        callNet: val.net,
                        callBid: val.bid,
                        callAsk: val.ask,
                        callVol: val.vol,
                        callIV: val.iv,
                        callDelta: val.delta,
                        callGamma: val.gamma,
                        callOpenInterest: val.openInterest,
                        putLastPrice: 0,
                        putNet: 0,
                        putBid: 0,
                        putAsk: 0,
                        putVol: 0,
                        putIV: 0,
                        putDelta: 0,
                        putGamma: 0,
                        putOpenInterest: 0
                    });
                }
                else {
                    lastInsertedGammaDetail.data.push({
                        strike,
                        callLastPrice: 0,
                        callNet: 0,
                        callBid: 0,
                        callAsk: 0,
                        callVol: 0,
                        callIV: 0,
                        callDelta: 0,
                        callGamma: 0,
                        callOpenInterest: 0,
                        putLastPrice: val.lastPrice,
                        putNet: val.net,
                        putBid: val.bid,
                        putAsk: val.ask,
                        putVol: val.vol,
                        putIV: val.iv,
                        putDelta: val.delta,
                        putGamma: val.gamma,
                        putOpenInterest: val.openInterest
                    });
                }
            }
        });
    });
    return gammaData;
}
