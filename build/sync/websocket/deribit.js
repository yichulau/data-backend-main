"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const async_1 = require("async");
const uuid_1 = require("uuid");
const blockTrade_1 = require("../../resource/blockTrade.js");
const contractsTraded_1 = require("../../resource/contractsTraded.js");
const common_1 = require("../../common.js");
let deribitSocket;
function startDeribitWS() {
    deribitSocket = new ws_1.WebSocket(common_1.deribit.wsURL);
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
        if (json.method !== "subscription")
            return;
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
exports.default = startDeribitWS;
async function _insertContracts(json) {
    const topic = json.params.channel;
    const kind = topic.split(".")[1];
    const coinCurrency = topic.split(".")[2];
    const coinCurrencyID = common_1.CURRENCY_ID[coinCurrency];
    await (0, async_1.eachSeries)(json.params.data, _iterateInsert);
    return;
    async function _iterateInsert(item) {
        try {
            if (kind === "option" && !item.block_trade_id) {
                await (0, contractsTraded_1.insertDeribitContract)(null, coinCurrencyID, item.trade_id, Math.floor(item.timestamp / 1000), item.tick_direction, item.price, item.mark_price, item.iv, item.instrument_name, item.index_price, item.direction, item.amount, JSON.stringify(json));
                console.log(`inserted deribit contract ${item.instrument_name} tradeID ${item.trade_id}`);
            }
            else if (item.block_trade_id) {
                await (0, blockTrade_1.insertDeribitBlockTrade)(null, (0, uuid_1.v4)(), coinCurrencyID, item.trade_id, item.instrument_name, item.trade_id, Math.floor(item.timestamp / 1000), item.direction, item.price, item.index_price, item.mark_price, item.amount, item.tick_direction, JSON.stringify(json));
                console.log(`inserted deribit block trade ${item.instrument_name} tradeID ${item.trade_id}`);
            }
        }
        catch (err) {
            throw err;
        }
        return;
    }
}
