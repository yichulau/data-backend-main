import DBConnection from "@database/conn";

import { deleteOldData as deleteOldExpiry } from "@resource/expiry";
import { deleteOldData as deleteOldGamma } from "@resource/gamma";

import { EXCHANGE_ID } from "../../../common";

export default async function (
  conn: DBConnection
): Promise<void> {

  const startTime = Date.now();

  try {
    await deleteOldExpiry(conn, EXCHANGE_ID.BINANCE);
    await deleteOldExpiry(conn, EXCHANGE_ID.BITCOM);
    await deleteOldExpiry(conn, EXCHANGE_ID.BYBIT);
    await deleteOldExpiry(conn, EXCHANGE_ID.DERIBIT);
    await deleteOldExpiry(conn, EXCHANGE_ID.OKEX);

    await deleteOldGamma(conn, EXCHANGE_ID.BINANCE);
    await deleteOldGamma(conn, EXCHANGE_ID.BITCOM);
    await deleteOldGamma(conn, EXCHANGE_ID.BYBIT);
    await deleteOldGamma(conn, EXCHANGE_ID.DERIBIT);
    await deleteOldGamma(conn, EXCHANGE_ID.OKEX);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log(`delete old expiry/gamma data completed in ${timeTaken}s`);
  }
  catch (err) {
    console.log("delete expiry error");
    throw err;
  }

  return;
}