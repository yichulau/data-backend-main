"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertOkexContract = exports.insertDeribitContract = exports.insertBybitContract = exports.insertBitcomContract = exports.insertBinanceContract = exports.getLast24HOkexContracts = exports.getLast24HDeribitContracts = exports.getLast24HBybitContracts = exports.getLast24HBitcomContracts = exports.getLast24HBinanceContracts = void 0;
const db_1 = __importDefault(require("../database/db.js"));
async function getLast24HBinanceContracts(conn, coinCurrencyID) {
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
      quantity
    FROM
      Contracts_Traded_Binance
    WHERE `;
    let data = [];
    if (coinCurrencyID) {
        query += "coinCurrencyID = ? AND ";
        data.push(coinCurrencyID);
    }
    query += "tradeTime >= NOW() - INTERVAL 1 DAY;";
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
exports.getLast24HBinanceContracts = getLast24HBinanceContracts;
async function getLast24HBitcomContracts(conn, coinCurrencyID) {
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
    query += "tradeTime >= NOW() - INTERVAL 1 DAY;";
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
exports.getLast24HBitcomContracts = getLast24HBitcomContracts;
async function getLast24HBybitContracts(conn, coinCurrencyID) {
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
    query += "tradeTime >= NOW() - INTERVAL 1 DAY;";
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
exports.getLast24HBybitContracts = getLast24HBybitContracts;
async function getLast24HDeribitContracts(conn, coinCurrencyID) {
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
    query += "tradeTime >= NOW() - INTERVAL 1 DAY";
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
exports.getLast24HDeribitContracts = getLast24HDeribitContracts;
async function getLast24HOkexContracts(conn, coinCurrencyID) {
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
    query += "tradeTime >= NOW() - INTERVAL 1 DAY";
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
exports.getLast24HOkexContracts = getLast24HOkexContracts;
async function insertBinanceContract(conn, coinCurrencyID, instrumentID, tradeID, tradeTime, price, indexPrice, quantity, buyerOrderID, sellerOrderID) {
    const query = `
    INSERT INTO Contracts_Traded_Binance
      (coinCurrencyID, instrumentID, tradeID, tradeTime, price,
      indexPrice, quantity, buyerOrderID, sellerOrderID)
    VALUES
      (?, ?, ?, FROM_UNIXTIME(?), ?,
      ?, ?, ?, ?);
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
        sellerOrderID
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
async function insertBitcomContract(conn, coinCurrencyID, instrumentID, tradeID, tradeTime, price, indexPrice, quantity, side) {
    const query = `
    INSERT INTO Contracts_Traded_Bitcom
      (coinCurrencyID, instrumentID, tradeID, tradeTime,
      price, indexPrice, quantity, side)
    VALUES
      (?, ?, FROM_UNIXTIME(?),
      ?, ?, ?, ?);
  `;
    const data = [
        coinCurrencyID,
        instrumentID,
        tradeID,
        tradeTime,
        price,
        indexPrice,
        quantity,
        side
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
async function insertBybitContract(conn, coinCurrencyID, instrumentID, tradeID, tradeTime, direction, positionQuantity, orderPrice, indexPrice, priceChangeDirection, isBlockTrade) {
    const query = `
    INSERT INTO Contracts_Traded_Bybit
      (coinCurrencyID, instrumentID, tradeID, tradeTime,
      direction, positionQuantity, orderPrice, indexPrice,
      priceChangeDirection, isBlockTrade)
    VALUES
      (?, ?, ?, FROM_UNIXTIME(?),
      ?, ?, ?, ?,
      ?, ?)
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
        isBlockTrade
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
async function insertDeribitContract(conn, coinCurrencyID, tradeID, tradeTime, tickDirection, price, markPrice, iv, instrumentName, indexPrice, direction, amount) {
    const query = `
    INSERT INTO Contracts_Traded_Deribit
      (coinCurrencyID, tradeID, tradeTime, tickDirection, price,
      markPrice, iv, instrumentName, indexPrice, direction, amount)
    VALUES
      (?, ?, FROM_UNIXTIME(?), ?, ?,
      ?, ?, ?, ?, ?, ?);
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
        amount
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
async function insertOkexContract(conn, coinCurrencyID, tradeID, tradeTime, instrumentID, instrumentFamily, price, quantity, side, optionType, fillVol, forwardPrice, indexPrice, markPrice) {
    const query = `
    INSERT INTO Contracts_Traded_Okex
      (coinCurrencyID, tradeID, tradeTime, instrumentID,
      instrumentFamily, price, quantity, side, optionType,
      fillVol, forwardPrice, indexPrice, markPrice)
    VALUES
      (?, ?, FROM_UNIXTIME(?), ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?);
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
        markPrice
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
