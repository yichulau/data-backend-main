"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldData = exports.insert = exports.getStrikes = exports.getExpiryDates = exports.getLatestExpiryData = void 0;
const moment_1 = __importDefault(require("moment"));
const async_1 = require("async");
const db_1 = __importDefault(require("../database/db.js"));
const common_1 = require("../common.js");
async function getLatestExpiryData(conn, exchangeID, coinCurrencyID, expiry, strike) {
    let result = [];
    try {
        if (exchangeID) {
            result = await _query(conn, exchangeID, coinCurrencyID, expiry, strike);
        }
        else {
            const exchangeIDs = Object.values(common_1.EXCHANGE_ID);
            await (0, async_1.eachSeries)(exchangeIDs, async (exchangeID) => {
                try {
                    const res = await _query(conn, exchangeID, coinCurrencyID, expiry, strike);
                    result = result.concat(res);
                }
                catch (err) {
                    throw err;
                }
                return;
            });
        }
    }
    catch (err) {
        throw err;
    }
    return _formatExpiryData(result);
    async function _query(conn, exchangeID, coinCurrencyID, expiry, strike) {
        let res;
        let data = [];
        const query = _getQueryString(exchangeID, coinCurrencyID, expiry, strike);
        if (coinCurrencyID)
            data.push(coinCurrencyID);
        if (expiry)
            data.push(expiry);
        if (strike)
            data.push(strike);
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
        return res[0].map((i) => ({ ...i, exchangeID }));
    }
    function _getQueryString(exchangeID, coinCurrencyID, expiry, strike) {
        const tableName = _getTableName(exchangeID);
        let query = `
      SELECT
        coinCurrencyID,
        UNIX_TIMESTAMP(ts) AS ts,
        expiry,
        strike,
        callOrPut,
        tradingVolume,
        openInterest
      FROM
        ${tableName}
      WHERE `;
        if (coinCurrencyID)
            query += "coinCurrencyID = ? AND ";
        if (expiry)
            query += "expiry = ? AND ";
        if (strike)
            query += "strike = ? AND ";
        query += `ts = (SELECT ts FROM ${tableName} ORDER BY ID DESC LIMIT 1);`;
        return query;
    }
}
exports.getLatestExpiryData = getLatestExpiryData;
async function getExpiryDates(conn, exchangeID, coinCurrencyID) {
    let result = [];
    let exchangeIDs = [];
    if (exchangeID) {
        exchangeIDs = [exchangeID];
    }
    else {
        exchangeIDs = Object.values(common_1.EXCHANGE_ID);
    }
    try {
        await (0, async_1.eachSeries)(exchangeIDs, async (exchangeID) => {
            try {
                const res = await _query(conn, exchangeID, coinCurrencyID);
                res.forEach(i => result.push((0, moment_1.default)(i.expiry).format(common_1.DATEFORMAT)));
            }
            catch (err) {
                throw err;
            }
            return;
        });
    }
    catch (err) {
        throw err;
    }
    result = [...new Set(result)];
    result.sort((a, b) => {
        return (0, moment_1.default)(a).valueOf() - (0, moment_1.default)(b).valueOf();
    });
    return result;
    async function _query(conn, exchangeID, coinCurrencyID) {
        let res;
        let data = [];
        const query = _getQueryString(exchangeID, coinCurrencyID);
        if (coinCurrencyID)
            data.push(coinCurrencyID);
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
        return res[0];
    }
    function _getQueryString(exchangeID, coinCurrencyID) {
        const tableName = _getTableName(exchangeID);
        let query = `
      SELECT DISTINCT
        expiry
      FROM
        ${tableName}
      WHERE `;
        if (coinCurrencyID)
            query += "coinCurrencyID = ? AND ";
        query += `ts = (SELECT ts FROM ${tableName} ORDER BY ID DESC LIMIT 1);`;
        return query;
    }
}
exports.getExpiryDates = getExpiryDates;
async function getStrikes(conn, exchangeID, coinCurrencyID) {
    let result = [];
    let exchangeIDs = [];
    if (exchangeID) {
        exchangeIDs = [exchangeID];
    }
    else {
        exchangeIDs = Object.values(common_1.EXCHANGE_ID);
    }
    try {
        await (0, async_1.eachSeries)(exchangeIDs, async (exchangeID) => {
            try {
                const res = await _query(conn, exchangeID, coinCurrencyID);
                res.forEach(i => result.push(i.strike));
            }
            catch (err) {
                throw err;
            }
            return;
        });
    }
    catch (err) {
        throw err;
    }
    return [...new Set(result)].sort((a, b) => a - b);
    async function _query(conn, exchangeID, coinCurrencyID) {
        let res;
        let data = [];
        const query = _getQueryString(exchangeID, coinCurrencyID);
        if (coinCurrencyID)
            data.push(coinCurrencyID);
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
        return res[0];
    }
    function _getQueryString(exchangeID, coinCurrencyID) {
        const tableName = _getTableName(exchangeID);
        let query = `
      SELECT DISTINCT
        strike
      FROM
        ${tableName}
      WHERE `;
        if (coinCurrencyID)
            query += "coinCurrencyID = ? AND ";
        query += `ts = (SELECT ts FROM ${tableName} ORDER BY ID DESC LIMIT 1);`;
        return query;
    }
}
exports.getStrikes = getStrikes;
async function insert(conn, exchangeID, coinCurrencyID, ts, expiry, strike, callOrPut, tradingVolume, openInterest) {
    const query = `
    INSERT INTO ${_getTableName(exchangeID)}
      (coinCurrencyID, ts, expiry, strike,
      callOrPut, tradingVolume, openInterest)
    VALUES
      (?,FROM_UNIXTIME(?),?,
      ?,?,?,?);
  `;
    const data = [
        coinCurrencyID,
        ts,
        expiry,
        strike,
        callOrPut,
        tradingVolume,
        openInterest
    ];
    try {
        await conn.query(query, data);
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
    WHERE ts <= NOW() - INTERVAL 3 HOUR;
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
        case common_1.EXCHANGE_ID.BINANCE: return "Expiry_Binance";
        case common_1.EXCHANGE_ID.BITCOM: return "Expiry_Bitcom";
        case common_1.EXCHANGE_ID.BYBIT: return "Expiry_Bybit";
        case common_1.EXCHANGE_ID.DERIBIT: return "Expiry_Deribit";
        case common_1.EXCHANGE_ID.OKEX: return "Expiry_Okex";
        default: return "";
    }
}
function _formatExpiryData(data) {
    let result = {
        expiryData: [],
        strikeData: []
    };
    data.forEach((item) => {
        const expiry = (0, moment_1.default)(item.expiry).format(common_1.DATEFORMAT);
        const strike = item.strike;
        const expiryInArr = result.expiryData.find((i) => {
            return i.expiry === expiry;
        });
        const strikeInArr = result.strikeData.find((i) => {
            return i.strike === strike;
        });
        const o = {
            callOITotal: 0,
            putOITotal: 0,
            callVolTotal: 0,
            putVolTotal: 0
        };
        if (!expiryInArr) {
            result.expiryData.push({ expiry, ...o });
        }
        if (!strikeInArr) {
            result.strikeData.push({ strike, ...o });
        }
    });
    data.forEach((item) => {
        const OI = Number(item.openInterest);
        const vol = Number(item.tradingVolume);
        const expTemp = (0, moment_1.default)(item.expiry).format(common_1.DATEFORMAT);
        const strike = item.strike;
        const expiryInArr = result.expiryData.find((i) => {
            return i.expiry === expTemp;
        });
        const strikeInArr = result.strikeData.find((i) => {
            return i.strike === strike;
        });
        if (item.callOrPut === "C") {
            expiryInArr.callOITotal += OI;
            expiryInArr.callVolTotal += vol;
            strikeInArr.callOITotal += OI;
            strikeInArr.callVolTotal += vol;
        }
        else if (item.callOrPut === "P") {
            expiryInArr.putOITotal += OI;
            expiryInArr.putVolTotal += vol;
            strikeInArr.putOITotal += OI;
            strikeInArr.putVolTotal += vol;
        }
    });
    result.expiryData.sort((a, b) => {
        return (0, moment_1.default)(a.expiry).valueOf() - (0, moment_1.default)(b.expiry).valueOf();
    });
    result.strikeData.sort((a, b) => {
        return a.strike - b.strike;
    });
    return result;
}
