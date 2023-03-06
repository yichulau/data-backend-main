"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const contractsTraded_1 = require("../../resource/contractsTraded.js");
const common_1 = require("../../common.js");
let bybitSocket;
let latestIndexPrice = {
    BTC: [],
    ETH: [],
    SOL: []
};
const INTERVAL_MS = 19000;
function startBybitWS() {
    bybitSocket = new ws_1.WebSocket(common_1.bybit.wsURL);
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
            if (bybitSocket.readyState === ws_1.WebSocket.OPEN) {
                bybitSocket.send('{"op": "ping"}');
            }
        }, INTERVAL_MS);
    })
        .on("message", async (data) => {
        const json = JSON.parse(data.toString());
        const topic = json.topic;
        if (typeof json.topic !== "string")
            return;
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
exports.default = startBybitWS;
function _updateLatestIndexPrice(data, topic) {
    const coinCurrency = topic.slice(-3);
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
async function _insertContract(item, topic) {
    const coinCurrency = topic.slice(-3);
    const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
    const ipData = latestIndexPrice[coinCurrency].find(i => {
        return i.instrumentID === item.s;
    });
    try {
        if (!ipData) {
            console.log(`bybit index price not found for ${item.s}`);
        }
        await (0, contractsTraded_1.insertBybitContract)(null, coinCurrencyID, item.s, item.i, Math.floor(item.T / 1000), item.S, item.v, item.p, ipData?.indexPrice || null, item.L, item.BT);
        console.log(`inserted bybit contract ${topic} | instrumentID: ${item.s} tradeID ${item.i}`);
    }
    catch (err) {
        console.error("bybit insert contract error");
        console.error(err);
    }
    return;
}
