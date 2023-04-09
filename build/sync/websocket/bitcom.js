"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const contractsTraded_1 = require("../../resource/contractsTraded.js");
const bitcom_1 = require("../../service/bitcom.js");
const common_1 = require("../../common.js");
let bitcomSocket;
let instruments = [];
const latestIndexPrice = {
    BTC: 0,
    ETH: 0
};
function startBitcomWS() {
    bitcomSocket = new ws_1.WebSocket(common_1.bitcom.wsURL);
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
        .on("open", async () => {
        console.log("bit.com websocket connected");
        bitcomSocket.send(JSON.stringify(idxPriceSubMsg));
        instruments = await _getInstruments();
        _subOrUnsubTrades(bitcomSocket, "subscribe", instruments);
        setInterval(async () => {
            _subOrUnsubTrades(bitcomSocket, "unsubscribe", instruments);
            instruments = await _getInstruments();
            _subOrUnsubTrades(bitcomSocket, "subscribe", instruments);
        }, 86400);
        setInterval(() => {
            if (bitcomSocket.readyState === ws_1.WebSocket.OPEN) {
                bitcomSocket.send('{"type": "ping", "params": {"id": 123}}');
            }
        }, 5000);
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
exports.default = startBitcomWS;
function _updateLatestIndexPrice(indexName, indexPrice) {
    const coinCurrency = indexName.substring(0, 3);
    latestIndexPrice[coinCurrency] = indexPrice;
    return;
}
async function _insertContract(json) {
    const item = json.data[0];
    const pair = item.pair;
    const coinCurrency = pair.substring(0, 3);
    const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
    const indexPrice = latestIndexPrice[coinCurrency];
    try {
        await (0, contractsTraded_1.insertBitcomContract)(null, coinCurrencyID, item.instrument_id, item.trade_id, Math.floor(item.created_at / 1000), item.price, indexPrice, item.qty, item.side, JSON.stringify(json));
        console.log(`inserted bit.com contract ${pair} | instrumentID: ${item.instrument_id} tradeID ${item.trade_id}`);
    }
    catch (err) {
        console.error("insert bit.com contract error");
        console.error(err);
    }
    return;
}
async function _getInstruments() {
    let instruments = [];
    try {
        const result = await (0, bitcom_1.getInstruments)();
        instruments = result
            .map(i => i.instrument_id)
            .filter(i => i.startsWith("BTC") || i.startsWith("ETH"));
    }
    catch (err) {
        throw err;
    }
    return instruments;
}
function _subOrUnsubTrades(socket, subOrUnsub, instruments) {
    const msg = {
        type: subOrUnsub,
        instruments,
        channels: ["trade"],
        interval: "raw"
    };
    socket.send(JSON.stringify(msg));
    if (subOrUnsub === "subscribe") {
        console.log(`bit.com subscribed to ${instruments.length} instruments`);
    }
    else {
        console.log(`bit.com unsubscribed from ${instruments.length} instruments`);
    }
    return;
}
