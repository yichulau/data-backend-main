import dotenv from "dotenv";
dotenv.config();

import {
  WebSocket,
  WebSocketServer
} from "ws";

import { IncomingMessage } from "http";

import {
  getRecentBitcomBlockTrades,
  getRecentBybitBlockTrades,
  getRecentDeribitBlockTrades,
  getRecentOkexBlockTrades
} from "@resource/blockTrade";

import {
  getRecentBinanceContracts,
  getRecentBitcomContracts,
  getRecentBybitContracts,
  getRecentDeribitContracts,
  getRecentOkexContracts
} from "@resource/contractsTraded";

import { EXCHANGE_ID } from "./common";

const port = Number(process.env.WSSPORT);

_startWSServer();

function _startWSServer () {
  const server = new WebSocketServer({ port });

  console.log(`websocket server listening on port ${port}`);

  server
    .on("connection", _onServerConnection)
    .on("error", _onServerError)
    .on("close", _onServerClose);

  function _onServerConnection (socket: WebSocket, req: IncomingMessage) {
    const remoteAddress = req.socket.remoteAddress;

    let socketSubscribed = false;
    // queryInProgress flag is to ensure trade queries are not run simultaneously
    // setInterval does not work well with async functions
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
      if (!socketSubscribed || queryInProgress) return;
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

    function _onSocketError (err: Error) {
      console.error(`socket error | address: ${remoteAddress}`);
      console.error(err);
    }

    function _onSocketMessage (data: any): void {
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

      if (typeof op !== "string") return;

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

    function _onSocketClose (code: number, reason: Buffer): void {
      clearInterval(timeoutInterval);
      clearInterval(queryInterval);
      console.log(`socket disconnected | code: ${code} reason: ${reason.toString()}`);
    }
  }

  function _onServerError (err: Error) {
    console.error("websocket server error");
    console.error(err);
  }

  function _onServerClose () {
    console.log("websocket server closed, restarting");
    _startWSServer();
  }
}

async function _getTrades (): Promise<any[]> {
  let result: any[] = [];

  try {
    const [bitcomBT, bybitBT, deribitBT, okexBT] = await Promise.all([
      getRecentBitcomBlockTrades(null, "1second"),
      getRecentBybitBlockTrades(null, "1second"),
      getRecentDeribitBlockTrades(null, "1second"),
      getRecentOkexBlockTrades(null, "1second")
    ]);

    const [binanceCon, bitcomCon, bybitCon, deribitCon, okexCon] = await Promise.all([
      getRecentBinanceContracts(null, "1second"),
      getRecentBitcomContracts(null, "1second"),
      getRecentBybitContracts(null, "1second"),
      getRecentDeribitContracts(null, "1second"),
      getRecentOkexContracts(null, "1second")
    ]);

    bitcomBT.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.BITCOM;
      item.type = "blocktrade";
      result.push(item);
    });
    bybitBT.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.BYBIT;
      item.type = "blocktrade";
      result.push(item);
    });
    deribitBT.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.DERIBIT;
      item.type = "blocktrade";
      result.push(item);
    });
    okexBT.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.OKEX;
      item.type = "blocktrade";
      result.push(item);
    });

    binanceCon.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.BINANCE;
      item.type = "contract";
      result.push(item);
    });
    bitcomCon.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.BITCOM;
      item.type = "contract";
      result.push(item);
    });
    bybitCon.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.BYBIT;
      item.type = "contract";
      result.push(item);
    });
    deribitCon.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.DERIBIT;
      item.type = "contract";
      result.push(item);
    });
    okexCon.forEach((item: any) => {
      item.exchangeID = EXCHANGE_ID.OKEX;
      item.type = "contract";
      result.push(item);
    });
  }
  catch (err) {
    throw err;
  }

  return result;
}

function _socketSend (socket: WebSocket, data: object): void {
  return socket.send(JSON.stringify(data));
}