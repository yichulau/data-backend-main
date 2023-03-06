"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const croner_1 = __importDefault(require("croner"));
const db_1 = __importDefault(require("../../database/db.js"));
const okex_1 = require("../../service/okex.js");
const binance_1 = __importDefault(require("./api/binance.js"));
const bitcom_1 = __importDefault(require("./api/bitcom.js"));
const bybit_1 = __importDefault(require("./api/bybit.js"));
const deribit_1 = __importDefault(require("./api/deribit.js"));
const okex_2 = __importDefault(require("./api/okex.js"));
const deleteExpiry_1 = __importDefault(require("./data/deleteExpiry.js"));
const calcVolumePremium_1 = __importDefault(require("./data/calcVolumePremium.js"));
const cronInterval = "0,30 */1 * * *";
function default_1() {
    (0, croner_1.default)(cronInterval, _main);
}
exports.default = default_1;
async function _main() {
    console.log(`starting data sync ${Date()}`);
    const nowSeconds = Math.floor(Date.now() / 1000);
    let dbConn;
    try {
        const btcSpotValue = await _getSpotValue("BTC-USDT");
        const ethSpotValue = await _getSpotValue("ETH-USDT");
        const solSpotValue = await _getSpotValue("SOL-USDT");
        dbConn = await db_1.default.getConnection();
        await (0, deleteExpiry_1.default)(dbConn);
        await (0, binance_1.default)(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
        await (0, bitcom_1.default)(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
        await (0, bybit_1.default)(dbConn, nowSeconds, btcSpotValue, ethSpotValue, solSpotValue);
        await (0, deribit_1.default)(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
        await (0, okex_2.default)(dbConn, nowSeconds, btcSpotValue, ethSpotValue);
        await (0, calcVolumePremium_1.default)(dbConn, nowSeconds, btcSpotValue, ethSpotValue, solSpotValue);
        console.log(`data sync completed ${Date()}`);
    }
    catch (err) {
        console.log(`data sync error ${Date()}`);
        console.error(err);
    }
    finally {
        dbConn?.release();
    }
    return;
}
async function _getSpotValue(coinCurrency) {
    try {
        const result = await (0, okex_1.getSpotValue)(coinCurrency);
        return result;
    }
    catch (err) {
        throw err;
    }
}
