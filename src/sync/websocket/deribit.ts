import { WebSocket } from "ws";
import { eachSeries } from "async";
import { v4 as uuidV4 } from "uuid";

import { insertDeribitBlockTrade } from "@resource/blockTrade";
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
        "trades.option.ETH.100ms",
        "trades.future.BTC.100ms",
        "trades.future.ETH.100ms"
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

      if (topic.startsWith("trades")) {
        await _insertContracts(json);
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

async function _insertContracts (json: any) {
  const topic = json.params.channel;
  const kind = <"option" | "future">topic.split(".")[1];
  const coinCurrency = <"BTC" | "SOL">topic.split(".")[2];
  const coinCurrencyID = CURRENCY_ID[coinCurrency];

  await eachSeries(json.params.data, _iterateInsert);

  return;

  async function _iterateInsert (item: any): Promise<void> {
    try {
      if (kind === "option" && !item.block_trade_id) {
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
          item.amount,
          JSON.stringify(json)
        );

        console.log(`inserted deribit contract ${item.instrument_name} tradeID ${item.trade_id}`);
      }
      else if (item.block_trade_id) {
        await insertDeribitBlockTrade(
          null,
          uuidV4(),
          coinCurrencyID,
          item.trade_id,
          item.instrument_name,
          item.trade_id,
          Math.floor(item.timestamp / 1000),
          item.direction,
          item.price,
          item.index_price,
          item.mark_price,
          item.amount,
          item.tick_direction,
          JSON.stringify(json)
        );

        console.log(`inserted deribit block trade ${item.instrument_name} tradeID ${item.trade_id}`);
      }
    }
    catch (err) {
      throw err;
    }

    return;
  }
}