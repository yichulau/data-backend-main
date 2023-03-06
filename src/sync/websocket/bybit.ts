import { WebSocket } from "ws";

import { insertBybitContract } from "@resource/contractsTraded";

import {
  CURRENCY_ID,
  bybit
} from "../../common";

type IndexPriceData = {
  instrumentID: string,
  indexPrice: number;
};

type LatestIndexPriceObj = {
  BTC: IndexPriceData[],
  ETH: IndexPriceData[],
  SOL: IndexPriceData[]
};

let bybitSocket: WebSocket;

let latestIndexPrice: LatestIndexPriceObj = {
  BTC: [],
  ETH: [],
  SOL: []
};

const INTERVAL_MS = 19000;

export default function startBybitWS () {
  bybitSocket = new WebSocket(bybit.wsURL);

  const openMsg = {
    op: "subscribe",
    args: [
      "publicTrade.BTC",
      "publicTrade.ETH",
      "publicTrade.SOL",
      "tickers.BTC",
      "tickers.ETH",
      "tickers.SOL"
    ]
  };

  bybitSocket
    .on("open", () => {
      console.log("bybit websocket connected");
      bybitSocket.send(JSON.stringify(openMsg));

      setInterval(() => {
        if (bybitSocket.readyState === WebSocket.OPEN) {
          bybitSocket.send('{"op": "ping"}');
        }
      }, INTERVAL_MS);
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.topic;

      if (typeof json.topic !== "string") return;

      if (topic.startsWith("tickers.")) {
        _updateLatestIndexPrice(json.data, topic);
      }
      else if (topic.startsWith("publicTrade.")) {
        await _insertContract(json.data[0], topic);
      }
    })
    .on("error", (err) => {
      console.error(err);
    })
    .on("close", (code, reason) => {
      console.log(`bybit websocket closing | code: ${code} reason: ${reason.toString()}`);
      startBybitWS();
    });
}

function _updateLatestIndexPrice (data: any, topic: string) {
  const coinCurrency = <"BTC" | "ETH" | "SOL">topic.slice(-3);

  const pricesData = latestIndexPrice[coinCurrency].find(i => {
    return i.instrumentID === data.symbol;
  });

  if (typeof pricesData === "undefined") {
    latestIndexPrice[coinCurrency].push({
      instrumentID: data.symbol,
      indexPrice: Number(data.indexPrice)
    });
  }
  else {
    pricesData.indexPrice = Number(data.indexPrice);
  }

  return;
}

async function _insertContract (item: any, topic: string) {
  const coinCurrency = <"BTC" | "ETH" | "SOL">topic.slice(-3);
  
  const coinCurrencyID = CURRENCY_ID[coinCurrency];
  
  const ipData = latestIndexPrice[coinCurrency].find(i => {
    return i.instrumentID === item.s;
  });

  try {
    if (!ipData) {
      console.log(`bybit index price not found for ${item.s}`);
    }

    await insertBybitContract(
      null,
      coinCurrencyID,
      item.s,
      item.i,
      Math.floor(item.T / 1000),
      item.S,
      item.v,
      item.p,
      ipData?.indexPrice || null,
      item.L,
      item.BT
    );

    console.log(`inserted bybit contract ${topic} | instrumentID: ${item.s} tradeID ${item.i}`);
  }
  catch (err) {
    console.error("bybit insert contract error");
    console.error(err);
  }

  return;
}