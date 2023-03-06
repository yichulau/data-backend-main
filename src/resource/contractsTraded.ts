import db from "@database/db";
import DBConnection from "@database/conn";

export async function getLast24HBinanceContracts (
  conn: DBConnection | null,
  coinCurrencyID?: number
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
      result = await db.query(query, data);
    }

    return result[0];
  }
  catch (err) {
    throw err;
  }
}

export async function getLast24HBitcomContracts (
  conn: DBConnection | null,
  coinCurrencyID?: number
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

  query += "tradeTime >= NOW() - INTERVAL 1 DAY;";

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

export async function getLast24HBybitContracts (
  conn: DBConnection | null,
  coinCurrencyID?: number
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

  query += "tradeTime >= NOW() - INTERVAL 1 DAY;";

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

export async function getLast24HDeribitContracts (
  conn: DBConnection | null,
  coinCurrencyID?: number
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

  query += "tradeTime >= NOW() - INTERVAL 1 DAY";

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

export async function getLast24HOkexContracts (
  conn: DBConnection | null,
  coinCurrencyID?: number
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

  query += "tradeTime >= NOW() - INTERVAL 1 DAY";

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
  sellerOrderID: number
): Promise<void> {

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
  side: "buy" | "sell"
): Promise<void> {

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
  isBlockTrade: boolean
): Promise<void> {

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
  amount: number
): Promise<void> {

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
  markPrice: number
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}