import DBConnection from "@database/conn";

import { deleteOldData } from "@resource/expiry";

import { EXCHANGE_ID } from "../../../common";

export default async function (
  conn: DBConnection
): Promise<void> {

  const startTime = Date.now();

  try {
    await deleteOldData(conn, EXCHANGE_ID.BINANCE);
    await deleteOldData(conn, EXCHANGE_ID.BITCOM);
    await deleteOldData(conn, EXCHANGE_ID.BYBIT);
    await deleteOldData(conn, EXCHANGE_ID.DERIBIT);
    await deleteOldData(conn, EXCHANGE_ID.OKEX);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`delete old expiry data completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("delete expiry error");
    throw err;
  }

  return;
}