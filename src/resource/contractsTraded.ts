import db from "@database/db";
import DBConnection from "@database/conn";

export async function getRecentBinanceContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number,
  limit?: number
): Promise<any[]> {

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
      result = await db.query(query, data);
    }

    return result[0];
  }
  catch (err) {
    throw err;
  }
}

export async function countRecentBinanceContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number
): Promise<number> {

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
      result = await db.query(query, data);
    }

    return result[0][0].count;
  }
  catch (err) {
    throw err;
  }
}

export async function getRecentBitcomContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number,
  limit?: number
): Promise<any[]> {

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
      result = await db.query(query, data);
    }

    return result[0];
  }
  catch (err) {
    throw err;
  }
}

export async function countRecentBitcomContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number
): Promise<number> {

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
      result = await db.query(query, data);
    }

    return result[0][0].count;
  }
  catch (err) {
    throw err;
  }
}

export async function getRecentBybitContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number,
  limit?: number
): Promise<any[]> {

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
      result = await db.query(query, data);
    }

    return result[0];
  }
  catch (err) {
    throw err;
  }
}

export async function countRecentBybitContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number
): Promise<number> {

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
      result = await db.query(query, data);
    }

    return result[0][0].count;
  }
  catch (err) {
    throw err;
  }
}

export async function getRecentDeribitContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number,
  limit?: number
): Promise<any[]> {

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
      result = await db.query(query, data);
    }

    return result[0];
  }
  catch (err) {
    throw err;
  }
}

export async function countRecentDeribitContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number
): Promise<number> {

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
      result = await db.query(query, data);
    }

    return result[0][0].count;
  }
  catch (err) {
    throw err;
  }
}

export async function getRecentOkexContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number,
  limit?: number
): Promise<any[]> {

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
      result = await db.query(query, data);
    }

    return result[0];
  }
  catch (err) {
    throw err;
  }
}

export async function countRecentOkexContracts (
  conn: DBConnection | null,
  interval: "1day" | "1second",
  coinCurrencyID?: number
): Promise<number> {

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
      result = await db.query(query, data);
    }

    return result[0][0].count;
  }
  catch (err) {
    throw err;
  }
}

export async function insertBinanceContract (
  conn: DBConnection | null,
  coinCurrencyID: number,
  instrumentID: string,
  tradeID: number,
  tradeTime: number, // unix timestamp in seconds
  price: number,
  indexPrice: number,
  quantity: number,
  buyerOrderID: number,
  sellerOrderID: number,
  direction: "buy" | "sell",
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

export async function insertBitcomContract (
  conn: DBConnection | null,
  coinCurrencyID: number,
  instrumentID: string,
  tradeID: number,
  tradeTime: number, // unix timestamp in seconds
  price: number,
  indexPrice: number,
  quantity: number,
  side: "buy" | "sell",
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

export async function insertBybitContract (
  conn: DBConnection | null,
  coinCurrencyID: number,
  instrumentID: string,
  tradeID: string,
  tradeTime: number, // unix timestamp in seconds
  direction: "Buy" | "Sell",
  positionQuantity: number,
  orderPrice: number,
  indexPrice: number | null,
  priceChangeDirection: string,
  isBlockTrade: boolean,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

export async function insertDeribitContract (
  conn: DBConnection | null,
  coinCurrencyID: number,
  tradeID: number,
  tradeTime: number, // unix timestamp in seconds
  tickDirection: number,
  price: number,
  markPrice: number,
  iv: string,
  instrumentName: string,
  indexPrice: number,
  direction: "buy" | "sell",
  amount: number,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

export async function insertOkexContract (
  conn: DBConnection | null,
  coinCurrencyID: number,
  tradeID: number,
  tradeTime: number, // unix timestamp in seconds
  instrumentID: string,
  instrumentFamily: string,
  price: number,
  quantity: number,
  side: "buy" | "sell",
  optionType: "C" | "P",
  fillVol: number,
  forwardPrice: number,
  indexPrice: number,
  markPrice: number,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}