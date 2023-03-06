import { WebSocket } from "ws";
import { eachSeries } from "async";

import { insertDeribitContract } from "@resource/contractsTraded";

import {
  CURRENCY_ID,
  deribit
} from "../../common";

let deribitSocket: WebSocket;

export default function startDeribitWS () {
  deribitSocket = new WebSocket(deribit.wsURL);

  const openMsg = {
    jsonRpc: "2.0",
    id: 42,
    method: "public/subscribe",
    params: {
      channels: [
        "trades.option.BTC.100ms",
        "trades.option.ETH.100ms"
      ]
    }
  };

  deribitSocket
    .on("open", () => {
      console.log("deribit websocket connected");
      deribitSocket.send(JSON.stringify(openMsg));
    })
    .on("message", async (data) => {
      const json = JSON.parse(data.toString());
      const topic = json.params?.channel;

      if (json.method !== "subscription") return;

      if (topic.startsWith("trades.option")) {
        await _insertContracts(json.params.data);
      }
    })
    .on("error", (err) => {
      console.error(err);
    })
    .on("close", (code, reason) => {
      console.log(`deribit websocket closing | code: ${code} reason: ${reason.toString()}`);
      setTimeout(startDeribitWS, 1000);
    });
}

async function _insertContracts (data: any) {
  await eachSeries(data,
    async (item) => {
      try {
        await _insertContract(item);
      }
      catch (err) {
        console.error("deribit insert contract error");
        console.error(err);
      }
      finally {
        return;
      }
    }
  );
}

async function _insertContract (item: any) {
  const coinCurrency = <"BTC" | "ETH">item.instrument_name.substring(0, 3);
  const coinCurrencyID = CURRENCY_ID[coinCurrency];

  try {
    await insertDeribitContract(
      null,
      coinCurrencyID,
      item.trade_id,
      Math.floor(item.timestamp / 1000),
      item.tick_direction,
      item.price,
      item.mark_price,
      item.iv,
      item.instrument_name,
      item.index_price,
      item.direction,
      item.amount
    );

    console.log(`inserted deribit contract ${item.instrument_name} tradeID ${item.trade_id}`);
  }
  catch (err) {
    throw err;
  }

  return;
}