"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ws_1 = require("ws");
const blockTrade_1 = require("./resource/blockTrade.js");
const contractsTraded_1 = require("./resource/contractsTraded.js");
const common_1 = require("./common.js");
const port = Number(process.env.WSSPORT);
_startWSServer();
function _startWSServer() {
    const server = new ws_1.WebSocketServer({ port });
    console.log(`websocket server listening on port ${port}`);
    server
        .on("connection", _onServerConnection)
        .on("error", _onServerError)
        .on("close", _onServerClose);
    function _onServerConnection(socket, req) {
        const remoteAddress = req.socket.remoteAddress;
        let socketSubscribed = false;
        let queryInProgress = false;
        let socketTimeoutSecs = 10;
        console.log(`socket connected | address: ${remoteAddress}`);
        const timeoutInterval = setInterval(() => {
            socketTimeoutSecs--;
            if (socketTimeoutSecs <= 0) {
                socket.close(1000);
            }
        }, 1000);
        const queryInterval = setInterval(async () => {
            if (!socketSubscribed || queryInProgress)
                return;
            queryInProgress = true;
            try {
                const trades = await _getTrades();
                const timestamp = Date.now();
                trades.forEach(trade => {
                    const body = {
                        success: true,
                        op: trade.type,
                        timestamp,
                        data: trade
                    };
                    _socketSend(socket, body);
                });
            }
            catch (err) {
                console.error(err);
                const body = {
                    success: false,
                    op: "dberr",
                    timestamp: Date.now()
                };
                _socketSend(socket, body);
            }
            finally {
                queryInProgress = false;
            }
        }, 1000);
        socket
            .on("error", _onSocketError)
            .on("message", _onSocketMessage)
            .on("close", _onSocketClose);
        function _onSocketError(err) {
            console.error(`socket error | address: ${remoteAddress}`);
            console.error(err);
        }
        function _onSocketMessage(data) {
            console.log(`${remoteAddress} sent: ${data.toString()}`);
            let json;
            try {
                json = JSON.parse(data.toString());
            }
            catch (err) {
                console.log(`received invalid data: ${data.toString()}`);
                return;
            }
            const op = json.op;
            if (typeof op !== "string")
                return;
            if (op === "ping") {
                socketTimeoutSecs = 10;
                const body = {
                    success: true,
                    op: "pong",
                    timestamp: Date.now()
                };
                _socketSend(socket, body);
            }
            else if (op === "subscribe") {
                socketSubscribed = true;
                const body = {
                    success: true,
                    op: "subscribe",
                    timestamp: Date.now()
                };
                _socketSend(socket, body);
            }
            else {
                const body = {
                    success: false,
                    op,
                    timestamp: Date.now()
                };
                _socketSend(socket, body);
            }
        }
        function _onSocketClose(code, reason) {
            clearInterval(timeoutInterval);
            clearInterval(queryInterval);
            console.log(`socket disconnected | code: ${code} reason: ${reason.toString()}`);
        }
    }
    function _onServerError(err) {
        console.error("websocket server error");
        console.error(err);
    }
    function _onServerClose() {
        console.log("websocket server closed, restarting");
        _startWSServer();
    }
}
async function _getTrades() {
    let result = [];
    try {
        const [bitcomBT, bybitBT, deribitBT, okexBT] = await Promise.all([
            (0, blockTrade_1.getRecentBitcomBlockTrades)(null, "1second"),
            (0, blockTrade_1.getRecentBybitBlockTrades)(null, "1second"),
            (0, blockTrade_1.getRecentDeribitBlockTrades)(null, "1second"),
            (0, blockTrade_1.getRecentOkexBlockTrades)(null, "1second")
        ]);
        const [binanceCon, bitcomCon, bybitCon, deribitCon, okexCon] = await Promise.all([
            (0, contractsTraded_1.getRecentBinanceContracts)(null, "1second"),
            (0, contractsTraded_1.getRecentBitcomContracts)(null, "1second"),
            (0, contractsTraded_1.getRecentBybitContracts)(null, "1second"),
            (0, contractsTraded_1.getRecentDeribitContracts)(null, "1second"),
            (0, contractsTraded_1.getRecentOkexContracts)(null, "1second")
        ]);
        bitcomBT.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.BITCOM;
            item.type = "blocktrade";
            result.push(item);
        });
        bybitBT.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.BYBIT;
            item.type = "blocktrade";
            result.push(item);
        });
        deribitBT.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.DERIBIT;
            item.type = "blocktrade";
            result.push(item);
        });
        okexBT.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.OKEX;
            item.type = "blocktrade";
            result.push(item);
        });
        binanceCon.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.BINANCE;
            item.type = "contract";
            result.push(item);
        });
        bitcomCon.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.BITCOM;
            item.type = "contract";
            result.push(item);
        });
        bybitCon.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.BYBIT;
            item.type = "contract";
            result.push(item);
        });
        deribitCon.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.DERIBIT;
            item.type = "contract";
            result.push(item);
        });
        okexCon.forEach((item) => {
            item.exchangeID = common_1.EXCHANGE_ID.OKEX;
            item.type = "contract";
            result.push(item);
        });
    }
    catch (err) {
        throw err;
    }
    return result;
}
function _socketSend(socket, data) {
    return socket.send(JSON.stringify(data));
}
