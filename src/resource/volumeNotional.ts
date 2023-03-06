import db from "@database/db";
import DBConnection from "@database/conn";

export async function get (
  conn: DBConnection | null,
  coinCurrencyID: number,
  exchangeID: number
): Promise<any[]> {

  let result;

  const query = `
    SELECT
      coinCurrencyID,
      exchangeID,
      UNIX_TIMESTAMP(ts) AS ts,
      value
    FROM Volume_Notional
    WHERE
      coinCurrencyID = ?
      AND
      exchangeID = ?
    ORDER BY
      ID DESC
    LIMIT 1000;
  `;

  const data = [
    coinCurrencyID,
    exchangeID
  ];

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

  return result[0];
}

export async function insert (
  conn: DBConnection | null,
  coinCurrencyID: number,
  exchangeID: number,
  ts: number, // unix timestamp in seconds
  value: number
): Promise<void> {

  const query = `
    INSERT INTO Volume_Notional
      (coinCurrencyID, exchangeID, ts, value)
    VALUES
      (?,?,FROM_UNIXTIME(?),?);
  `;

  const data = [
    coinCurrencyID,
    exchangeID,
    ts,
    value
  ];

  try {
    if (conn) {
      await conn.query(query, data);
    }
    else {
      await db.query(query, data);
    }
  }
  catch (err) {
    throw err;
  }

  return;
}