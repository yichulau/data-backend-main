import { WebSocket } from "ws";

import { insertBitcomContract } from "@resource/contractsTraded";

import {
  CURRENCY_ID,
  bitcom
} from "../../common";

let bitcomSocket: WebSocket;

let latestIndexPrice = {
  BTC: 0,
  ETH: 0
};

const INTERVAL_MS = 5000;

export default function startBitcomWS () {
  bitcomSocket = new WebSocket(bitcom.wsURL);

  const tradeSubMsg = {
    type: "subscribe",
    currencies: [
      "BTC",
      "ETH"
    ],
    channels: [
      "market_trade"
    ],
    interval: "raw"
  };

  const idxPriceSubMsg = {
    type: "subscribe",
    pairs: [
      "BTC-USDT",
      "ETH-USDT"
    ],
    channels: [
      "index_price"
    ],
    interval: "raw"
  }

  bitcomSocket
    .on("open", () => {
      console.log("bit.com websocket connected");

      bitcomSocket.send(JSON.stringify(tradeSubMsg));
      bitcomSocket.send(JSON.stringify(idxPriceSubMsg));

      setInterval(() => {
        if (bitcomSocket.readyState === WebSocket.OPEN) {
          bitcomSocket.send('{"type": "ping", "params": {"id": 123}}');
        }
      }, INTERVAL_MS);
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.channel;

      if (typeof topic !== "string") return;

      if (topic === "index_price") {
        _updateLatestIndexPrice(json.data.index_name, Number(json.data.index_price));
      }
      else if (topic === "market_trade") {
        await _insertContract(json);
      }
    })
    .on("error", (err) => {
      console.error(err);
    })
    .on("close", (code, reason) => {
      console.log(`bit.com websocket closing | code: ${code} reason: ${reason.toString()}`);
      startBitcomWS();
    });
}

function _updateLatestIndexPrice (indexName: string, indexPrice: number) {
  const coinCurrency = <"BTC" | "ETH">indexName.substring(0, 3);
  latestIndexPrice[coinCurrency] = indexPrice;

  return;
}

async function _insertContract (json: any) {
  const item = json.data[0];
  const pair = item.pair;

  const coinCurrency = <"BTC" | "ETH">pair.substring(0, 3);
  
  const coinCurrencyID = CURRENCY_ID[coinCurrency];
  const indexPrice = latestIndexPrice[coinCurrency];

  try {
    await insertBitcomContract(
      null,
      coinCurrencyID,
      item.instrument_id,
      item.trade_id,
      Math.floor(item.created_at / 1000),
      item.price,
      indexPrice,
      item.qty,
      item.side,
      JSON.stringify(json)
    );

    console.log(`inserted bit.com contract ${pair} | instrumentID: ${item.instrument_id} tradeID ${item.trade_id}`);
  }
  catch (err) {
    console.error("insert bit.com contract error");
    console.error(err);
  }

  return;
}