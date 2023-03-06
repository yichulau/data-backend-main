import moment from "moment";
import { eachSeries } from "async";

import db from "@database/db";
import DBConnection from "@database/conn";

import {
  EXCHANGE_ID,
  DATEFORMAT
} from "../common";

export async function getLatestExpiryData (
  conn: DBConnection | null,
  exchangeID?: number,
  coinCurrencyID?: number,
  expiry?: string,
  strike?: string
): Promise<ExpiryDataResult> {

  let result: any[] = [];

  try {
    if (exchangeID) {
      result = await _query(conn, exchangeID, coinCurrencyID, expiry, strike);
    }
    else {
      const exchangeIDs = Object.values(EXCHANGE_ID);

      await eachSeries(exchangeIDs,
        async (exchangeID) => {
          try {
            const res = await _query(conn, exchangeID, coinCurrencyID, expiry, strike);
            result = result.concat(res);
          }
          catch (err) {
            throw err;
          }

          return;
        }
      );
    }
  }
  catch (err) {
    throw err;
  }

  return _formatExpiryData(result);

  async function _query (
    conn: DBConnection | null,
    exchangeID: number,
    coinCurrencyID?: number,
    expiry?: string,
    strike?: string
  ): Promise<any[]> {

    let res;
    let data = [];
    const query = _getQueryString(exchangeID, coinCurrencyID, expiry, strike);

    if (coinCurrencyID) data.push(coinCurrencyID);
    if (expiry) data.push(expiry);
    if (strike) data.push(strike);

    try {
      if (conn) {
        res = await conn.query(query, data);
      }
      else {
        res = await db.query(query, data);
      }
    }
    catch (err) {
      throw err;
    }

    return res[0].map((i: any) => ({ ...i, exchangeID }));
  }

  function _getQueryString (
    exchangeID: number,
    coinCurrencyID?: number,
    expiry?: string,
    strike?: string
  ): string {

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

    if (coinCurrencyID) query += "coinCurrencyID = ? AND ";
    if (expiry) query += "expiry = ? AND ";
    if (strike) query += "strike = ? AND ";

    query += `ts = (SELECT ts FROM ${tableName} ORDER BY ID DESC LIMIT 1);`;

    return query;
  }
}

export async function getExpiryDates (
  conn: DBConnection | null,
  exchangeID?: number,
  coinCurrencyID?: number
): Promise<string[]> {

  let result: string[] = [];
  let exchangeIDs: number[] = [];

  if (exchangeID) {
    exchangeIDs = [exchangeID];
  }
  else {
    exchangeIDs = Object.values(EXCHANGE_ID);
  }

  try {
    await eachSeries(exchangeIDs,
      async (exchangeID) => {
        try {
          const res = await _query(conn, exchangeID, coinCurrencyID);
          res.forEach(i => result.push(moment(i.expiry).format(DATEFORMAT)));
        }
        catch (err) {
          throw err;
        }

        return;
      }
    );
  }
  catch (err) {
    throw err;
  }

  result = [...new Set(result)];

  result.sort((a, b) => {
    return moment(a).valueOf() - moment(b).valueOf();
  });

  return result;

  async function _query (
    conn: DBConnection | null,
    exchangeID: number,
    coinCurrencyID?: number
  ): Promise<any[]> {

    let res;
    let data = [];
    const query = _getQueryString(exchangeID, coinCurrencyID);

    if (coinCurrencyID) data.push(coinCurrencyID);

    try {
      if (conn) {
        res = await conn.query(query, data);
      }
      else {
        res = await db.query(query, data);
      }
    }
    catch (err) {
      throw err;
    }

    return res[0];
  }

  function _getQueryString (
    exchangeID: number,
    coinCurrencyID?: number
  ): string {

    const tableName = _getTableName(exchangeID);

    let query = `
      SELECT DISTINCT
        expiry
      FROM
        ${tableName}
      WHERE `;

    if (coinCurrencyID) query += "coinCurrencyID = ? AND ";

    query += `ts = (SELECT ts FROM ${tableName} ORDER BY ID DESC LIMIT 1);`;

    return query;
  }
}

export async function getStrikes (
  conn: DBConnection | null,
  exchangeID?: number,
  coinCurrencyID?: number
): Promise<number[]> {

  let result: number[] = [];
  let exchangeIDs: number[] = [];

  if (exchangeID) {
    exchangeIDs = [exchangeID];
  }
  else {
    exchangeIDs = Object.values(EXCHANGE_ID);
  }

  try {
    await eachSeries(exchangeIDs,
      async (exchangeID) => {
        try {
          const res = await _query(conn, exchangeID, coinCurrencyID);
          res.forEach(i => result.push(i.strike));
        }
        catch (err) {
          throw err;
        }

        return;
      }
    );
  }
  catch (err) {
    throw err;
  }

  return [...new Set(result)].sort((a, b) => a - b);

  async function _query (
    conn: DBConnection | null,
    exchangeID: number,
    coinCurrencyID?: number
  ): Promise<any[]> {

    let res;
    let data = [];
    const query = _getQueryString(exchangeID, coinCurrencyID);

    if (coinCurrencyID) data.push(coinCurrencyID);

    try {
      if (conn) {
        res = await conn.query(query, data);
      }
      else {
        res = await db.query(query, data);
      }
    }
    catch (err) {
      throw err;
    }

    return res[0];
  }

  function _getQueryString (
    exchangeID: number,
    coinCurrencyID?: number
  ): string {

    const tableName = _getTableName(exchangeID);

    let query = `
      SELECT DISTINCT
        strike
      FROM
        ${tableName}
      WHERE `;

    if (coinCurrencyID) query += "coinCurrencyID = ? AND ";

    query += `ts = (SELECT ts FROM ${tableName} ORDER BY ID DESC LIMIT 1);`;

    return query;
  }
}

export async function insert (
  conn: DBConnection,
  exchangeID: number,
  coinCurrencyID: number,
  ts: number, // unix timestamp in seconds
  expiry: string,
  strike: number,
  callOrPut: "C" | "P",
  tradingVolume: number,
  openInterest: number
): Promise<void> {

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

export async function deleteOldData (
  conn: DBConnection,
  exchangeID: number
): Promise<void> {

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

function _getTableName (exchangeID: number) {
  switch (exchangeID) {
    case EXCHANGE_ID.BINANCE: return "Expiry_Binance";
    case EXCHANGE_ID.BITCOM: return "Expiry_Bitcom";
    case EXCHANGE_ID.BYBIT: return "Expiry_Bybit";
    case EXCHANGE_ID.DERIBIT: return "Expiry_Deribit";
    case EXCHANGE_ID.OKEX: return "Expiry_Okex";
    default: return "";
  }
}

function _formatExpiryData (
  data: any[]
): ExpiryDataResult {

  let result: ExpiryDataResult = {
    expiryData: [],
    strikeData: []
  };

  data.forEach((item: any) => {
    const expiry = moment(item.expiry).format(DATEFORMAT);
    const strike = item.strike;

    const expiryInArr = result.expiryData.find((i: any) => {
      return i.expiry === expiry;
    });

    const strikeInArr = result.strikeData.find((i: any) => {
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

  data.forEach((item: any) => {
    const OI = Number(item.openInterest);
    const vol = Number(item.tradingVolume);

    const expTemp = moment(item.expiry).format(DATEFORMAT);
    const strike = item.strike;

    const expiryInArr = <ExpiryValues>result.expiryData.find((i: any) => {
      return i.expiry === expTemp;
    });

    const strikeInArr = <StrikeValues>result.strikeData.find((i: any) => {
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
    return moment(a.expiry).valueOf() - moment(b.expiry).valueOf();
  });

  result.strikeData.sort((a, b) => {
    return a.strike - b.strike;
  });

  return result;
}