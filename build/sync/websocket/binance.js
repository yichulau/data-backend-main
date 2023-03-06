"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const contractsTraded_1 = require("../../resource/contractsTraded.js");
const common_1 = require("../../common.js");
let binanceSocket;
let latestIndexPrice = {
    BTC: 0,
    ETH: 0,
    SOL: 0
};
function startBinanceWS() {
    binanceSocket = new ws_1.WebSocket(common_1.binance.wsURL);
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
        if (typeof topic !== "string")
            return;
        if (topic.includes("@index")) {
            _updateLatestIndexPrice(json.data, topic);
        }
        else if (topic.includes("@trade")) {
            await _insertContract(json.data, topic);
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
exports.default = startBinanceWS;
function _updateLatestIndexPrice(data, topic) {
    const coinCurrency = topic.substring(0, 3);
    latestIndexPrice[coinCurrency] = Number(data.p);
    return;
}
async function _insertContract(item, topic) {
    const coinCurrency = topic.substring(0, 3);
    const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
    const indexPrice = latestIndexPrice[coinCurrency];
    try {
        await (0, contractsTraded_1.insertBinanceContract)(null, coinCurrencyID, item.s, item.t, Math.floor(item.T / 1000), item.p, indexPrice, item.q, item.b, item.a);
        console.log(`inserted binance contract ${topic} | instrumentID: ${item.s} tradeID: ${item.t}`);
    }
    catch (err) {
        console.error("binance insert contract error");
        console.error(err);
    }
    return;
}
