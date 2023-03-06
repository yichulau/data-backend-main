"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insert = exports.get = void 0;
const db_1 = __importDefault(require("../database/db.js"));
async function get(conn, coinCurrencyID, exchangeID) {
    let result;
    const query = `
    SELECT
      coinCurrencyID,
      exchangeID,
      UNIX_TIMESTAMP(ts) AS ts,
      value
    FROM Open_Interest
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
            result = await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    return result[0];
}
exports.get = get;
async function insert(conn, coinCurrencyID, exchangeID, ts, value) {
    const query = `
    INSERT INTO Open_Interest
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
            await db_1.default.query(query, data);
        }
    }
    catch (err) {
        throw err;
    }
    return;
}
exports.insert = insert;
