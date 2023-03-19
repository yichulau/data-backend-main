import { WebSocket } from "ws";

import { insertBinanceContract } from "@resource/contractsTraded";

import {
  CURRENCY_ID,
  binance
} from "../../common";

let binanceSocket: WebSocket;

let latestIndexPrice = {
  BTC: 0,
  ETH: 0,
  SOL: 0
};

export default function startBinanceWS () {
  binanceSocket = new WebSocket(binance.wsURL);

  const openMsg = {
    method: "SUBSCRIBE",
    params: [
      "BTC@trade",
      "ETH@trade",
      "SOL@trade",
      "BTCUSDT@index",
      "ETHUSDT@index",
      "SOLUSDT@index"
    ],
    id: 1
  };

  binanceSocket
    .on("open", () => {
      console.log("binance websocket connected");
      binanceSocket.send(JSON.stringify(openMsg));
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.stream;

      if (typeof topic !== "string") return;

      if (topic.includes("@index")) {
        _updateLatestIndexPrice(json.data, topic);
      }
      else if (topic.includes("@trade")) {
        await _insertContract(json);
      }
    })
    .on("error", (err) => {
      console.error(err);
    })
    .on("close", (code, reason) => {
      console.log(`binance websocket closing | code: ${code} reason: ${reason.toString()}`);
      startBinanceWS();
    });
}

function _updateLatestIndexPrice (data: any, topic: string) {
  const coinCurrency = <"BTC" | "ETH" | "SOL">topic.substring(0, 3);
  latestIndexPrice[coinCurrency] = Number(data.p);

  return;
}

async function _insertContract (json: any) {
  const item = json.data;
  const topic = json.stream;

  const coinCurrency = <"BTC" | "ETH" | "SOL">topic.substring(0, 3);

  const coinCurrencyID = CURRENCY_ID[coinCurrency];
  const indexPrice = latestIndexPrice[coinCurrency];

  try {
    await insertBinanceContract(
      null,
      coinCurrencyID,
      item.s,
      item.t,
      Math.floor(item.T / 1000),
      item.p,
      indexPrice,
      item.q,
      item.b,
      item.a,
      item.S === 1 ? "buy" : "sell",
      JSON.stringify(json)
    );

    console.log(`inserted binance contract ${topic} | instrumentID: ${item.s} tradeID: ${item.t}`);
  }
  catch (err) {
    console.error("binance insert contract error");
    console.error(err);
  }

  return;
}