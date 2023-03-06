"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const contractsTraded_1 = require("../../resource/contractsTraded.js");
const common_1 = require("../../common.js");
let bitcomSocket;
let latestIndexPrice = {
    BTC: 0,
    ETH: 0
};
const INTERVAL_MS = 5000;
function startBitcomWS() {
    bitcomSocket = new ws_1.WebSocket(common_1.bitcom.wsURL);
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
    };
    bitcomSocket
        .on("open", () => {
        console.log("bit.com websocket connected");
        bitcomSocket.send(JSON.stringify(tradeSubMsg));
        bitcomSocket.send(JSON.stringify(idxPriceSubMsg));
        setInterval(() => {
            if (bitcomSocket.readyState === ws_1.WebSocket.OPEN) {
                bitcomSocket.send('{"type": "ping", "params": {"id": 123}}');
            }
        }, INTERVAL_MS);
    })
        .on("message", async (data) => {
        const json = JSON.parse(data.toString());
        const topic = json.channel;
        if (typeof topic !== "string")
            return;
        if (topic === "index_price") {
            _updateLatestIndexPrice(json.data.index_name, Number(json.data.index_price));
        }
        else if (topic === "market_trade") {
            await _insertContract(json.data[0], json.data[0].pair);
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
exports.default = startBitcomWS;
function _updateLatestIndexPrice(indexName, indexPrice) {
    const coinCurrency = indexName.substring(0, 3);
    latestIndexPrice[coinCurrency] = indexPrice;
    return;
}
async function _insertContract(item, pair) {
    const coinCurrency = pair.substring(0, 3);
    const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
    const indexPrice = latestIndexPrice[coinCurrency];
    try {
        await (0, contractsTraded_1.insertBitcomContract)(null, coinCurrencyID, item.instrument_id, item.trade_id, Math.floor(item.created_at / 1000), item.price, indexPrice, item.qty, item.side);
        console.log(`inserted bit.com contract ${pair} | instrumentID: ${item.instrument_id} tradeID ${item.trade_id}`);
    }
    catch (err) {
        console.error("insert bit.com contract error");
        console.error(err);
    }
    return;
}
