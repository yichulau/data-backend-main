"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertOkexBlockTrade = exports.insertDeribitBlockTrade = exports.insertBybitBlockTrade = exports.insertBitcomBlockTrade = exports.getRecentOkexBlockTrades = exports.getRecentDeribitBlockTrades = exports.getRecentBybitBlockTrades = exports.getRecentBitcomBlockTrades = void 0;
const db_1 = __importDefault(require("../database/db.js"));
async function getRecentBitcomBlockTrades(conn, duration, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      blockTradeID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      side,
      price,
      underlyingPrice,
      size,
      sigma,
      rawData
    FROM
      Block_Trade_Bitcom
    WHERE
  `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (duration === "6hour") {
        query += "tradeTime >= NOW() - INTERVAL 6 HOUR;";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND;";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    result[0].forEach((item) => {
        item.rawData = JSON.stringify(item.rawData);
    });
    return result[0];
}
exports.getRecentBitcomBlockTrades = getRecentBitcomBlockTrades;
async function getRecentBybitBlockTrades(conn, duration, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      blockTradeID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      side,
      price,
      size,
      rawData
    FROM
      Block_Trade_Bybit
    WHERE
  `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (duration === "6hour") {
        query += "tradeTime >= NOW() - INTERVAL 6 HOUR;";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND;";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    result[0].forEach((item) => {
        item.rawData = JSON.stringify(item.rawData);
    });
    return result[0];
}
exports.getRecentBybitBlockTrades = getRecentBybitBlockTrades;
async function getRecentDeribitBlockTrades(conn, duration, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      blockTradeID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      direction,
      price,
      indexPrice,
      markPrice,
      size,
      tickDirection,
      rawData
    FROM
      Block_Trade_Deribit
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (duration === "6hour") {
        query += "tradeTime >= NOW() - INTERVAL 6 HOUR;";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND;";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    result[0].forEach((item) => {
        item.rawData = JSON.stringify(item.rawData);
    });
    return result[0];
}
exports.getRecentDeribitBlockTrades = getRecentDeribitBlockTrades;
async function getRecentOkexBlockTrades(conn, duration, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      blockTradeID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      side,
      price,
      size,
      rawData
    FROM
      Block_Trade_Okex
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (duration === "6hour") {
        query += "tradeTime >= NOW() - INTERVAL 6 HOUR;";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND;";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    result[0].forEach((item) => {
        item.rawData = JSON.stringify(item.rawData);
    });
    return result[0];
}
exports.getRecentOkexBlockTrades = getRecentOkexBlockTrades;
async function insertBitcomBlockTrade(conn, ID, coinCurrencyID, blockTradeID, instrumentID, tradeID, tradeTime, side, price, underlyingPrice, size, sigma, rawData) {
    const query = `
    INSERT IGNORE INTO Block_Trade_Bitcom
      (ID, coinCurrencyID, blockTradeID, instrumentID,
      tradeID, tradeTime, side, price,
      underlyingPrice, size, sigma, rawData)
    VALUES
      (?, ?, ?, ?,
      ?, FROM_UNIXTIME(?), ?, ?,
      ?, ?, ?, ?);
  `;
    const data = [
        ID,
        coinCurrencyID,
        blockTradeID,
        instrumentID,
        tradeID,
        tradeTime,
        side,
        price,
        underlyingPrice,
        size,
        sigma,
        rawData
    ];
    try {
        if (conn) {
            await conn.query(query, data);
        }
        else {
            await db_1.default.query(query, data);
        }
        return;
    }
    catch (err) {
        throw err;
    }
}
exports.insertBitcomBlockTrade = insertBitcomBlockTrade;
async function insertBybitBlockTrade(conn, ID, coinCurrencyID, blockTradeID, instrumentID, tradeID, tradeTime, side, price, size, rawData) {
    const query = `
    INSERT IGNORE INTO Block_Trade_Bybit
      (ID, coinCurrencyID, blockTradeID, instrumentID,
      tradeID, tradeTime, side, price,
      size, rawData)
    VALUES
      (?, ?, ?, ?,
      ?, FROM_UNIXTIME(?), ?, ?,
      ?, ?);
  `;
    const data = [
        ID,
        coinCurrencyID,
        blockTradeID,
        instrumentID,
        tradeID,
        tradeTime,
        side,
        price,
        size,
        rawData
    ];
    try {
        if (conn) {
            await conn.query(query, data);
        }
        else {
            await db_1.default.query(query, data);
        }
        return;
    }
    catch (err) {
        throw err;
    }
}
exports.insertBybitBlockTrade = insertBybitBlockTrade;
async function insertDeribitBlockTrade(conn, ID, coinCurrencyID, blockTradeID, instrumentID, tradeID, tradeTime, direction, price, indexPrice, markPrice, size, tickDirection, rawData) {
    const query = `
    INSERT IGNORE INTO Block_Trade_Deribit
      (ID, coinCurrencyID, blockTradeID, instrumentID,
      tradeID, tradeTime, direction, price,
      indexPrice, markPrice, size, tickDirection, rawData)
    VALUES
      (?, ?, ?, ?,
      ?, FROM_UNIXTIME(?), ?, ?,
      ?, ?, ?, ?, ?);
  `;
    const data = [
        ID,
        coinCurrencyID,
        blockTradeID,
        instrumentID,
        tradeID,
        tradeTime,
        direction,
        price,
        indexPrice,
        markPrice,
        size,
        tickDirection,
        rawData
    ];
    try {
        if (conn) {
            await conn.query(query, data);
        }
        else {
            await db_1.default.query(query, data);
        }
        return;
    }
    catch (err) {
        throw err;
    }
}
exports.insertDeribitBlockTrade = insertDeribitBlockTrade;
async function insertOkexBlockTrade(conn, ID, coinCurrencyID, blockTradeID, instrumentID, tradeID, tradeTime, side, price, size, rawData) {
    const query = `
    INSERT IGNORE INTO Block_Trade_Okex
      (ID, coinCurrencyID, blockTradeID, instrumentID,
      tradeID, tradeTime, side, price,
      size, rawData)
    VALUES
      (?, ?, ?, ?,
      ?, FROM_UNIXTIME(?), ?, ?,
      ?, ?);
  `;
    const data = [
        ID,
        coinCurrencyID,
        blockTradeID,
        instrumentID,
        tradeID,
        tradeTime,
        side,
        price,
        size,
        rawData
    ];
    try {
        if (conn) {
            await conn.query(query, data);
        }
        else {
            await db_1.default.query(query, data);
        }
        return;
    }
    catch (err) {
        throw err;
    }
}
exports.insertOkexBlockTrade = insertOkexBlockTrade;
