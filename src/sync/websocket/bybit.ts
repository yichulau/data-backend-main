import { WebSocket } from "ws";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import { insertBybitBlockTrade } from "@resource/blockTrade";
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
  SOL: IndexPriceData[];
};

let bybitOptionSocket: WebSocket;
let bybitSpotSocket: WebSocket;
let bybitInverseSocket: WebSocket;
let bybitLinearSocket: WebSocket;

let latestIndexPrice: LatestIndexPriceObj = {
  BTC: [],
  ETH: [],
  SOL: []
};

const INTERVAL_MS = 19000;

export default function startBybitWS () {
  _contractWS();
  _spotWS();
  _inverseWS();
  _linearWS();
}

function _contractWS () {
  bybitOptionSocket = new WebSocket(bybit.optionWsURL);

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

  bybitOptionSocket
    .on("open", () => {
      console.log("bybit option websocket connected");
      bybitOptionSocket.send(JSON.stringify(openMsg));

      setInterval(() => {
        if (bybitOptionSocket.readyState === WebSocket.OPEN) {
          bybitOptionSocket.send('{"op": "ping"}');
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
        await _insert(json, true);
      }
    })
    .on("error", console.error)
    .on("close", (code, reason) => {
      console.log(`bybit option websocket closing | code: ${code} reason: ${reason.toString()}`);
      _contractWS();
    });
}

function _spotWS () {
  bybitSpotSocket = new WebSocket(bybit.spotWsURL);

  const openMsg = {
    op: "subscribe",
    args: [
      "publicTrade.BTCUSDT",
      "publicTrade.ETHUSDT",
      "publicTrade.SOLUSDT"
    ]
  };

  bybitSpotSocket
    .on("open", () => {
      console.log("bybit spot socket connected");
      bybitSpotSocket.send(JSON.stringify(openMsg));

      setInterval(() => {
        if (bybitSpotSocket.readyState === WebSocket.OPEN) {
          bybitSpotSocket.send('{"op": "ping"}');
        }
      }, INTERVAL_MS);
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.topic;

      if (typeof json.topic !== "string") return;

      if (topic.startsWith("publicTrade.")) {
        await _insert(json, false);
      }
    })
    .on("error", console.error)
    .on("close", (code, reason) => {
      console.log(`bybit spot websocket closing | code: ${code} reason: ${reason.toString()}`);
      _spotWS();
    });
}

function _inverseWS () {
  bybitInverseSocket = new WebSocket(bybit.inverseWsURL);

  const openMsg = {
    op: "subscribe",
    args: [
      "publicTrade.BTCUSD",
      "publicTrade.ETHUSD",
      "publicTrade.SOLUSD"
    ]
  };

  bybitInverseSocket
    .on("open", () => {
      console.log("bybit inverse socket connected");
      bybitInverseSocket.send(JSON.stringify(openMsg));

      setInterval(() => {
        if (bybitInverseSocket.readyState === WebSocket.OPEN) {
          bybitInverseSocket.send('{"op": "ping"}');
        }
      }, INTERVAL_MS);
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.topic;

      if (typeof json.topic !== "string") return;

      if (topic.startsWith("publicTrade.")) {
        await _insert(json, false);
      }
    })
    .on("error", console.error)
    .on("close", (code, reason) => {
      console.log(`bybit inverse websocket closing | code: ${code} reason: ${reason.toString()}`);
      _inverseWS();
    });
}

function _linearWS () {
  bybitLinearSocket = new WebSocket(bybit.linearWsURL);

  const openMsg = {
    op: "subscribe",
    args: [
      "publicTrade.BTCUSDT",
      "publicTrade.ETHUSDT",
      "publicTrade.SOLUSDT"
    ]
  };

  bybitLinearSocket
    .on("open", () => {
      console.log("bybit linear socket connected");
      bybitLinearSocket.send(JSON.stringify(openMsg));

      setInterval(() => {
        if (bybitLinearSocket.readyState === WebSocket.OPEN) {
          bybitLinearSocket.send('{"op": "ping"}');
        }
      }, INTERVAL_MS);
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.topic;

      if (typeof json.topic !== "string") return;

      if (topic.startsWith("publicTrade.")) {
        await _insert(json, false);
      }
    })
    .on("error", console.error)
    .on("close", (code, reason) => {
      console.log(`bybit linear websocket closing | code: ${code} reason: ${reason.toString()}`);
      _linearWS();
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

async function _insert (json: any, isForOptionWs: boolean) {
  const topic = json.topic;
  const coinCurrency = <"BTC" | "ETH" | "SOL">topic.split(".")[1].substring(0, 3);
  const coinCurrencyID = CURRENCY_ID[coinCurrency];

  await eachSeries(json.data, _iterateInsert);

  return;

  async function _iterateInsert (item: any) {
    try {
      if (isForOptionWs && !item.BT) {
        // only insert non block trade options
        const ipData = latestIndexPrice[coinCurrency].find(i => {
          return i.instrumentID === item.s;
        });

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
          item.BT,
          JSON.stringify(json)
        );

        console.log(`inserted bybit contract ${topic} | instrumentID: ${item.s} tradeID ${item.i}`);
      }
      else if (item.BT) {
        await insertBybitBlockTrade(
          null,
          uuidV4(),
          coinCurrencyID,
          item.i,
          item.s,
          item.i,
          Math.floor(item.T / 1000),
          item.S,
          item.p,
          item.v,
          JSON.stringify(json)
        );

        console.log(`inserted bybit contract ${topic} | instrumentID: ${item.s} tradeID ${item.i}`);
      }
    }
    catch (err) {
      if (isForOptionWs && !item.BT) {
        console.error("bybit contract insert error");
      }
      else {
        console.error("bybit block trade insert error");
      }

      console.error(err);
    }

    return;
  }
}