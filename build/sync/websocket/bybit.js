"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const async_1 = require("async");
const uuid_1 = require("uuid");
const blockTrade_1 = require("../../resource/blockTrade.js");
const contractsTraded_1 = require("../../resource/contractsTraded.js");
const common_1 = require("../../common.js");
let bybitOptionSocket;
let bybitSpotSocket;
let bybitInverseSocket;
let bybitLinearSocket;
let latestIndexPrice = {
    BTC: [],
    ETH: [],
    SOL: []
};
const INTERVAL_MS = 19000;
function startBybitWS() {
    _contractWS();
    _spotWS();
    _inverseWS();
    _linearWS();
}
exports.default = startBybitWS;
function _contractWS() {
    bybitOptionSocket = new ws_1.WebSocket(common_1.bybit.optionWsURL);
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
            if (bybitOptionSocket.readyState === ws_1.WebSocket.OPEN) {
                bybitOptionSocket.send('{"op": "ping"}');
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
            await _insert(json, true);
        }
    })
        .on("error", console.error)
        .on("close", (code, reason) => {
        console.log(`bybit option websocket closing | code: ${code} reason: ${reason.toString()}`);
        _contractWS();
    });
}
function _spotWS() {
    bybitSpotSocket = new ws_1.WebSocket(common_1.bybit.spotWsURL);
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
            if (bybitSpotSocket.readyState === ws_1.WebSocket.OPEN) {
                bybitSpotSocket.send('{"op": "ping"}');
            }
        }, INTERVAL_MS);
    })
        .on("message", async (data) => {
        const json = JSON.parse(data.toString());
        const topic = json.topic;
        if (typeof json.topic !== "string")
            return;
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
function _inverseWS() {
    bybitInverseSocket = new ws_1.WebSocket(common_1.bybit.inverseWsURL);
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
            if (bybitInverseSocket.readyState === ws_1.WebSocket.OPEN) {
                bybitInverseSocket.send('{"op": "ping"}');
            }
        }, INTERVAL_MS);
    })
        .on("message", async (data) => {
        const json = JSON.parse(data.toString());
        const topic = json.topic;
        if (typeof json.topic !== "string")
            return;
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
function _linearWS() {
    bybitLinearSocket = new ws_1.WebSocket(common_1.bybit.linearWsURL);
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
            if (bybitLinearSocket.readyState === ws_1.WebSocket.OPEN) {
                bybitLinearSocket.send('{"op": "ping"}');
            }
        }, INTERVAL_MS);
    })
        .on("message", async (data) => {
        const json = JSON.parse(data.toString());
        const topic = json.topic;
        if (typeof json.topic !== "string")
            return;
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
async function _insert(json, isForOptionWs) {
    const topic = json.topic;
    const coinCurrency = topic.split(".")[1].substring(0, 3);
    const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
    await (0, async_1.eachSeries)(json.data, _iterateInsert);
    return;
    async function _iterateInsert(item) {
        try {
            if (isForOptionWs && !item.BT) {
                const ipData = latestIndexPrice[coinCurrency].find(i => {
                    return i.instrumentID === item.s;
                });
                await (0, contractsTraded_1.insertBybitContract)(null, coinCurrencyID, item.s, item.i, Math.floor(item.T / 1000), item.S, item.v, item.p, ipData?.indexPrice || null, item.L, item.BT, JSON.stringify(json));
                console.log(`inserted bybit contract ${topic} | instrumentID: ${item.s} tradeID ${item.i}`);
            }
            else if (item.BT) {
                await (0, blockTrade_1.insertBybitBlockTrade)(null, (0, uuid_1.v4)(), coinCurrencyID, item.i, item.s, item.i, Math.floor(item.T / 1000), item.S, item.p, item.v, JSON.stringify(json));
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
