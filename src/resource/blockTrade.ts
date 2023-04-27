import db from "@database/db";
import DBConnection from "@database/conn";

export async function getRecentBitcomBlockTrades (
  conn: DBConnection | null,
  duration: "24hour" | "6hour" | "1second",
  coinCurrencyID?: number
): Promise<any[]> {

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
  if (duration === "24hour") {
    query += "tradeTime >= NOW() - INTERVAL 24 HOUR;";
  }
  else if (duration === "6hour") {
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
      result = await db.query(query, data);
    }
  }
  catch (err) {
    throw err;
  }

  result[0].forEach((item: any) => {
    item.rawData = JSON.stringify(item.rawData);
  });

  return result[0];
}

export async function getRecentBybitBlockTrades (
  conn: DBConnection | null,
  duration: "24hour" | "6hour" | "1second",
  coinCurrencyID?: number
): Promise<any[]> {

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

  if (duration === "24hour") {
    query += "tradeTime >= NOW() - INTERVAL 24 HOUR;";
  }
  else if (duration === "6hour") {
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
      result = await db.query(query, data);
    }
  }
  catch (err) {
    throw err;
  }

  result[0].forEach((item: any) => {
    item.rawData = JSON.stringify(item.rawData);
  });

  return result[0];
}

export async function getRecentDeribitBlockTrades (
  conn: DBConnection | null,
  duration: "24hour" | "6hour" | "1second",
  coinCurrencyID?: number
): Promise<any[]> {

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

  if (duration === "24hour") {
    query += "tradeTime >= NOW() - INTERVAL 24 HOUR;";
  }
  else if (duration === "6hour") {
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
      result = await db.query(query, data);
    }
  }
  catch (err) {
    throw err;
  }

  result[0].forEach((item: any) => {
    item.rawData = JSON.stringify(item.rawData);
  });

  return result[0];
}

export async function getRecentOkexBlockTrades (
  conn: DBConnection | null,
  duration: "24hour" | "6hour" | "1second",
  coinCurrencyID?: number
): Promise<any[]> {

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

  if (duration === "24hour") {
    query += "tradeTime >= NOW() - INTERVAL 24 HOUR;";
  }
  else if (duration === "6hour") {
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
      result = await db.query(query, data);
    }
  }
  catch (err) {
    throw err;
  }

  result[0].forEach((item: any) => {
    item.rawData = JSON.stringify(item.rawData);
  });

  return result[0];
}

export async function insertBitcomBlockTrade (
  conn: DBConnection | null,
  ID: string,
  coinCurrencyID: number,
  blockTradeID: bigint,
  instrumentID: string,
  tradeID: bigint,
  tradeTime: number,
  side: "buy" | "sell",
  price: number,
  underlyingPrice: number,
  size: number,
  sigma: number,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

// insert from websocket
export async function insertBybitBlockTrade (
  conn: DBConnection | null,
  ID: string,
  coinCurrencyID: number,
  blockTradeID: string,
  instrumentID: string,
  tradeID: string,
  tradeTime: number,
  side: "Buy" | "Sell",
  price: number,
  size: number,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

export async function insertDeribitBlockTrade (
  conn: DBConnection | null,
  ID: string,
  coinCurrencyID: number,
  blockTradeID: string,
  instrumentID: string,
  tradeID: string,
  tradeTime: number,
  direction: "buy" | "sell",
  price: number,
  indexPrice: number,
  markPrice: number,
  size: number,
  tickDirection: number,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}

export async function insertOkexBlockTrade (
  conn: DBConnection | null,
  ID: string,
  coinCurrencyID: number,
  blockTradeID: string,
  instrumentID: string,
  tradeID: bigint,
  tradeTime: number,
  side: "buy" | "sell",
  price: number,
  size: number,
  rawData: string
): Promise<void> {

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
      await db.query(query, data);
    }

    return;
  }
  catch (err) {
    throw err;
  }
}