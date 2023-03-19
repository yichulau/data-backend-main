import Redis from "ioredis";

import {
  binanceSymbolCachePrefix,
  binanceSymbolCacheExpirySecs,
  bitcomInstrumentCachePrefix,
  bitcomInstrumentCacheExpirySecs,
  okexLastBlockTradeIDKey
} from "../common";

const redis = new Redis();

export default {
  getBinanceSymbol,
  setBinanceSymbol,
  getBitcomInstrument,
  setBitcomInstrument,
  getOkexLastBlockTradeID,
  setOkexLastBlockTradeID
};

async function getBinanceSymbol (
  symbol: string
): Promise<BinanceSymbolValues | undefined> {

  try {
    const result = await redis.get(`${binanceSymbolCachePrefix}${symbol}`);

    if (!result) return undefined;
    return JSON.parse(result);
  }
  catch (err) {
    throw err;
  }
}

async function setBinanceSymbol (
  obj: BinanceSymbolValues
): Promise<void> {

  try {
    await redis.setex(
      `${binanceSymbolCachePrefix}${obj.symbol}`,
      binanceSymbolCacheExpirySecs,
      JSON.stringify(obj)
    );
  }
  catch (err) {
    throw err;
  }

  return;
}

async function getBitcomInstrument (
  instrumentID: string
): Promise<BitcomInstValues | undefined> {

  try {
    const result = await redis.get(`${bitcomInstrumentCachePrefix}${instrumentID}`);

    if (!result) return undefined;
    return JSON.parse(result);
  }
  catch (err) {
    throw err;
  }
}

async function setBitcomInstrument (
  obj: BitcomInstValues
): Promise<void> {

  try {
    await redis.setex(
      `${bitcomInstrumentCachePrefix}${obj.instrumentID}`,
      bitcomInstrumentCacheExpirySecs,
      JSON.stringify(obj)
    );
  }
  catch (err) {
    throw err;
  }

  return;
}

async function getOkexLastBlockTradeID (
): Promise<string | undefined> {

  try {
    const result = await redis.get(okexLastBlockTradeIDKey);

    if (!result) return undefined;
    return result;
  }
  catch (err) {
    throw err;
  }
}

async function setOkexLastBlockTradeID (
  blockTradeID: string
): Promise<void> {

  try {
    await redis.set(
      okexLastBlockTradeIDKey,
      blockTradeID
    );
  }
  catch (err) {
    throw err;
  }

  return;
}