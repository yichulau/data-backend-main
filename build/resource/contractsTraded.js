"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertOkexContract = exports.insertDeribitContract = exports.insertBybitContract = exports.insertBitcomContract = exports.insertBinanceContract = exports.countRecentOkexContracts = exports.getRecentOkexContracts = exports.countRecentDeribitContracts = exports.getRecentDeribitContracts = exports.countRecentBybitContracts = exports.getRecentBybitContracts = exports.countRecentBitcomContracts = exports.getRecentBitcomContracts = exports.countRecentBinanceContracts = exports.getRecentBinanceContracts = void 0;
const db_1 = __importDefault(require("../database/db.js"));
async function getRecentBinanceContracts(conn, interval, coinCurrencyID, limit) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      price,
      indexPrice,
      quantity,
      direction
    FROM
      Contracts_Traded_Binance
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    if (limit) {
        query += "ORDER BY tradeTime DESC LIMIT ?";
        data.push(limit);
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0];
    }
    catch (err) {
        throw err;
    }
}
exports.getRecentBinanceContracts = getRecentBinanceContracts;
async function countRecentBinanceContracts(conn, interval, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      COUNT(ID) AS count
    FROM
      Contracts_Traded_Binance
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0][0].count;
    }
    catch (err) {
        throw err;
    }
}
exports.countRecentBinanceContracts = countRecentBinanceContracts;
async function getRecentBitcomContracts(conn, interval, coinCurrencyID, limit) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      price,
      indexPrice,
      quantity,
      side
    FROM
      Contracts_Traded_Bitcom
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    if (limit) {
        query += "ORDER BY tradeTime DESC LIMIT ?";
        data.push(limit);
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0];
    }
    catch (err) {
        throw err;
    }
}
exports.getRecentBitcomContracts = getRecentBitcomContracts;
async function countRecentBitcomContracts(conn, interval, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      COUNT(ID) AS count
    FROM
      Contracts_Traded_Bitcom
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0][0].count;
    }
    catch (err) {
        throw err;
    }
}
exports.countRecentBitcomContracts = countRecentBitcomContracts;
async function getRecentBybitContracts(conn, interval, coinCurrencyID, limit) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      direction,
      positionQuantity,
      orderPrice,
      indexPrice,
      priceChangeDirection,
      isBlockTrade
    FROM
      Contracts_Traded_Bybit
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    if (limit) {
        query += "ORDER BY tradeTime DESC LIMIT ?";
        data.push(limit);
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0];
    }
    catch (err) {
        throw err;
    }
}
exports.getRecentBybitContracts = getRecentBybitContracts;
async function countRecentBybitContracts(conn, interval, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      COUNT(ID) AS count
    FROM
      Contracts_Traded_Bybit
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0][0].count;
    }
    catch (err) {
        throw err;
    }
}
exports.countRecentBybitContracts = countRecentBybitContracts;
async function getRecentDeribitContracts(conn, interval, coinCurrencyID, limit) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      instrumentName AS instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      tickDirection,
      price,
      indexPrice,
      markPrice,
      direction,
      amount
    FROM
      Contracts_Traded_Deribit
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    if (limit) {
        query += "ORDER BY tradeTime DESC LIMIT ?";
        data.push(limit);
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0];
    }
    catch (err) {
        throw err;
    }
}
exports.getRecentDeribitContracts = getRecentDeribitContracts;
async function countRecentDeribitContracts(conn, interval, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      COUNT(ID) AS count
    FROM
      Contracts_Traded_Deribit
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0][0].count;
    }
    catch (err) {
        throw err;
    }
}
exports.countRecentDeribitContracts = countRecentDeribitContracts;
async function getRecentOkexContracts(conn, interval, coinCurrencyID, limit) {
    let result;
    let query = `
    SELECT
      ID,
      coinCurrencyID,
      instrumentID,
      tradeID,
      UNIX_TIMESTAMP(tradeTime) AS tradeTime,
      price,
      indexPrice,
      markPrice,
      quantity,
      side
    FROM Contracts_Traded_Okex
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    if (limit) {
        query += "ORDER BY tradeTime DESC LIMIT ?";
        data.push(limit);
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0];
    }
    catch (err) {
        throw err;
    }
}
exports.getRecentOkexContracts = getRecentOkexContracts;
async function countRecentOkexContracts(conn, interval, coinCurrencyID) {
    let result;
    let query = `
    SELECT
      COUNT(ID) AS count
    FROM
      Contracts_Traded_Okex
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    if (interval === "1day") {
        query += "tradeTime >= NOW() - INTERVAL 1 DAY ";
    }
    else {
        query += "tradeTime >= NOW() - INTERVAL 1 SECOND ";
    }
    try {
        if (conn) {
            result = await conn.query(query, data);
        }
        else {
            result = await db_1.default.query(query, data);
        }
        return result[0][0].count;
    }
    catch (err) {
        throw err;
    }
}
exports.countRecentOkexContracts = countRecentOkexContracts;
async function insertBinanceContract(conn, coinCurrencyID, instrumentID, tradeID, tradeTime, price, indexPrice, quantity, buyerOrderID, sellerOrderID, direction, rawData) {
    const query = `
    INSERT IGNORE INTO Contracts_Traded_Binance
      (coinCurrencyID, instrumentID, tradeID, tradeTime,
      price, indexPrice, quantity, buyerOrderID,
      sellerOrderID, direction, rawData)
    VALUES
      (?, ?, ?, FROM_UNIXTIME(?),
      ?, ?, ?, ?,
      ?, ?, ?);
  `;
    const data = [
        coinCurrencyID,
        instrumentID,
        tradeID,
        tradeTime,
        price,
        indexPrice,
        quantity,
        buyerOrderID,
        sellerOrderID,
        direction,
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
exports.insertBinanceContract = insertBinanceContract;
async function insertBitcomContract(conn, coinCurrencyID, instrumentID, tradeID, tradeTime, price, indexPrice, quantity, side, rawData) {
    const query = `
    INSERT IGNORE INTO Contracts_Traded_Bitcom
      (coinCurrencyID, instrumentID, tradeID, tradeTime,
      price, indexPrice, quantity, side, rawData)
    VALUES
      (?, ?, FROM_UNIXTIME(?),
      ?, ?, ?, ?, ?);
  `;
    const data = [
        coinCurrencyID,
        instrumentID,
        tradeID,
        tradeTime,
        price,
        indexPrice,
        quantity,
        side,
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
exports.insertBitcomContract = insertBitcomContract;
async function insertBybitContract(conn, coinCurrencyID, instrumentID, tradeID, tradeTime, direction, positionQuantity, orderPrice, indexPrice, priceChangeDirection, isBlockTrade, rawData) {
    const query = `
    INSERT IGNORE INTO Contracts_Traded_Bybit
      (coinCurrencyID, instrumentID, tradeID, tradeTime,
      direction, positionQuantity, orderPrice, indexPrice,
      priceChangeDirection, isBlockTrade, rawData)
    VALUES
      (?, ?, ?, FROM_UNIXTIME(?),
      ?, ?, ?, ?,
      ?, ?, ?)
  `;
    const data = [
        coinCurrencyID,
        instrumentID,
        tradeID,
        tradeTime,
        direction,
        positionQuantity,
        orderPrice,
        indexPrice,
        priceChangeDirection,
        isBlockTrade,
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
exports.insertBybitContract = insertBybitContract;
async function insertDeribitContract(conn, coinCurrencyID, tradeID, tradeTime, tickDirection, price, markPrice, iv, instrumentName, indexPrice, direction, amount, rawData) {
    const query = `
    INSERT IGNORE INTO Contracts_Traded_Deribit
      (coinCurrencyID, tradeID, tradeTime, tickDirection,
      price, markPrice, iv, instrumentName, indexPrice,
      direction, amount, rawData)
    VALUES
      (?, ?, FROM_UNIXTIME(?), ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?);
  `;
    const data = [
        coinCurrencyID,
        tradeID,
        tradeTime,
        tickDirection,
        price,
        markPrice,
        iv,
        instrumentName,
        indexPrice,
        direction,
        amount,
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
exports.insertDeribitContract = insertDeribitContract;
async function insertOkexContract(conn, coinCurrencyID, tradeID, tradeTime, instrumentID, instrumentFamily, price, quantity, side, optionType, fillVol, forwardPrice, indexPrice, markPrice, rawData) {
    const query = `
    INSERT IGNORE INTO Contracts_Traded_Okex
      (coinCurrencyID, tradeID, tradeTime, instrumentID,
      instrumentFamily, price, quantity, side, optionType,
      fillVol, forwardPrice, indexPrice, markPrice, rawData)
    VALUES
      (?, ?, FROM_UNIXTIME(?), ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?);
  `;
    const data = [
        coinCurrencyID,
        tradeID,
        tradeTime,
        instrumentID,
        instrumentFamily,
        price,
        quantity,
        side,
        optionType,
        fillVol,
        forwardPrice,
        indexPrice,
        markPrice,
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
exports.insertOkexContract = insertOkexContract;
