import { WebSocket } from "ws";

import { insertOkexContract } from "@resource/contractsTraded";

import {
  CURRENCY_ID,
  okex
} from "../../common";

const INTERVAL_MS = 5000;

let okexSocket: WebSocket;

export default function startOkexWS () {
  okexSocket = new WebSocket(okex.wsURL);

  const openMsg = {
    op: "subscribe",
    args: [
      {
        channel: "option-trades",
        instType: "OPTION",
        instFamily: "BTC-USD"
      },
      {
        channel: "option-trades",
        instType: "OPTION",
        instFamily: "ETH-USD"
      }
    ]
  };

  okexSocket
    .on("open", () => {
      console.log("okex websocket connected");
      okexSocket.send(JSON.stringify(openMsg));

      setInterval(() => {
        if (okexSocket.readyState === WebSocket.OPEN) {
          okexSocket.send("ping");
        }
      }, INTERVAL_MS);
    })
    .on("message", async (data) => {
      if (data.toString() === "pong") return;
      const json = JSON.parse(data.toString());

      if (!json.event && json.arg?.channel === "option-trades") {
        await _insertContract(json);
      }
    })
    .on("error", (err) => {
      console.error(err);
    })
    .on("close", (code, reason) => {
      console.log(`okex websocket closing | code: ${code} reason: ${reason.toString()}`);
      startOkexWS();
    });
}

async function _insertContract (json: any) {
  const item = json.data[0];
  const instFamily = json.arg.instFamily;

  let coinCurrencyID = 0;

  switch (instFamily) {
    case "BTC-USD": coinCurrencyID = CURRENCY_ID.BTC; break;
    case "ETH-USD": coinCurrencyID = CURRENCY_ID.ETH; break;
    case "SOL-USD": coinCurrencyID = CURRENCY_ID.SOL; break;
  }

  try {
    await insertOkexContract(
      null,
      coinCurrencyID,
      item.tradeId,
      Math.floor(item.ts / 1000),
      item.instId,
      item.instFamily,
      item.px,
      item.sz,
      item.side,
      item.optType,
      item.fillVol,
      item.fwdPx,
      item.indexPx,
      item.markPx,
      JSON.stringify(json)
    );

    console.log(`inserted okex contract ${instFamily} tradeID ${item.tradeId}`);
  }
  catch (err) {
    console.error("okex insert contract error");
    console.error(err);
  }

  return;
}