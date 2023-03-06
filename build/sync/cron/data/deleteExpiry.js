"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expiry_1 = require("../../../resource/expiry.js");
const common_1 = require("../../../common.js");
async function default_1(conn) {
    const startTime = Date.now();
    try {
        await (0, expiry_1.deleteOldData)(conn, common_1.EXCHANGE_ID.BINANCE);
        await (0, expiry_1.deleteOldData)(conn, common_1.EXCHANGE_ID.BITCOM);
        await (0, expiry_1.deleteOldData)(conn, common_1.EXCHANGE_ID.BYBIT);
        await (0, expiry_1.deleteOldData)(conn, common_1.EXCHANGE_ID.DERIBIT);
        await (0, expiry_1.deleteOldData)(conn, common_1.EXCHANGE_ID.OKEX);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`delete old expiry data completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("delete expiry error");
        throw err;
    }
    return;
}
exports.default = default_1;
