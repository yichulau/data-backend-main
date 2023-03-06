"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const volumePremium_1 = require("../../../resource/volumePremium.js");
const contractsTraded_1 = require("../../../resource/contractsTraded.js");
const common_1 = require("../../../common.js");
async function default_1(conn, syncTime, btcSpotValue, ethSpotValue, solSpotValue) {
    const startTime = Date.now();
    try {
        const binanceContracts = await _getLast24HContracts(conn, common_1.EXCHANGE_ID.BINANCE);
        const bitcomContracts = await _getLast24HContracts(conn, common_1.EXCHANGE_ID.BITCOM);
        const bybitContracts = await _getLast24HContracts(conn, common_1.EXCHANGE_ID.BYBIT);
        const deribitContracts = await _getLast24HContracts(conn, common_1.EXCHANGE_ID.DERIBIT);
        const okexContracts = await _getLast24HContracts(conn, common_1.EXCHANGE_ID.OKEX);
        const { binanceBTCvolPrem, binanceETHvolPrem, binanceSOLvolPrem, bitcomBTCvolPrem, bitcomETHvolPrem, bitcomSOLvolPrem, bybitBTCvolPrem, bybitETHvolPrem, bybitSOLvolPrem, deribitBTCvolPrem, deribitETHvolPrem, deribitSOLvolPrem, okexBTCvolPrem, okexETHvolPrem, okexSOLvolPrem } = _getPremiumVolume(binanceContracts, bitcomContracts, bybitContracts, deribitContracts, okexContracts, btcSpotValue, ethSpotValue, solSpotValue);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.BTC, common_1.EXCHANGE_ID.BINANCE, syncTime, binanceBTCvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.ETH, common_1.EXCHANGE_ID.BINANCE, syncTime, binanceETHvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.SOL, common_1.EXCHANGE_ID.BINANCE, syncTime, binanceSOLvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.BTC, common_1.EXCHANGE_ID.BITCOM, syncTime, bitcomBTCvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.ETH, common_1.EXCHANGE_ID.BITCOM, syncTime, bitcomETHvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.SOL, common_1.EXCHANGE_ID.BITCOM, syncTime, bitcomSOLvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.BTC, common_1.EXCHANGE_ID.BYBIT, syncTime, bybitBTCvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.ETH, common_1.EXCHANGE_ID.BYBIT, syncTime, bybitETHvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.SOL, common_1.EXCHANGE_ID.BYBIT, syncTime, bybitSOLvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.BTC, common_1.EXCHANGE_ID.DERIBIT, syncTime, deribitBTCvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.ETH, common_1.EXCHANGE_ID.DERIBIT, syncTime, deribitETHvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.SOL, common_1.EXCHANGE_ID.DERIBIT, syncTime, deribitSOLvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.BTC, common_1.EXCHANGE_ID.OKEX, syncTime, okexBTCvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.ETH, common_1.EXCHANGE_ID.OKEX, syncTime, okexETHvolPrem);
        await _insertPremiumVolume(conn, common_1.CURRENCY_ID.SOL, common_1.EXCHANGE_ID.OKEX, syncTime, okexSOLvolPrem);
        const timeTaken = (Date.now() - startTime) / 1000;
        console.log(`premium volume calc completed in ${timeTaken}s`);
    }
    catch (err) {
        console.log("premium volume calc error");
        console.error(err);
    }
    return;
}
exports.default = default_1;
async function _getLast24HContracts(conn, exchangeID) {
    let result = [];
    try {
        switch (exchangeID) {
            case common_1.EXCHANGE_ID.BINANCE:
                result = await (0, contractsTraded_1.getLast24HBinanceContracts)(conn);
                break;
            case common_1.EXCHANGE_ID.BITCOM:
                result = await (0, contractsTraded_1.getLast24HBitcomContracts)(conn);
                break;
            case common_1.EXCHANGE_ID.BYBIT:
                result = await (0, contractsTraded_1.getLast24HBybitContracts)(conn);
                break;
            case common_1.EXCHANGE_ID.DERIBIT:
                result = await (0, contractsTraded_1.getLast24HDeribitContracts)(conn);
                break;
            case common_1.EXCHANGE_ID.OKEX:
                result = await (0, contractsTraded_1.getLast24HOkexContracts)(conn);
                break;
        }
    }
    catch (err) {
        throw err;
    }
    return result;
}
function _getPremiumVolume(binanceContracts, bitcomContracts, bybitContracts, deribitContracts, okexContracts, btcSpotValue, ethSpotValue, solSpotValue) {
    let binanceBTCvolPrem = 0;
    let binanceETHvolPrem = 0;
    let binanceSOLvolPrem = 0;
    let bitcomBTCvolPrem = 0;
    let bitcomETHvolPrem = 0;
    let bitcomSOLvolPrem = 0;
    let bybitBTCvolPrem = 0;
    let bybitETHvolPrem = 0;
    let bybitSOLvolPrem = 0;
    let deribitBTCvolPrem = 0;
    let deribitETHvolPrem = 0;
    let deribitSOLvolPrem = 0;
    let okexBTCvolPrem = 0;
    let okexETHvolPrem = 0;
    let okexSOLvolPrem = 0;
    binanceContracts.forEach(item => {
        const premiumVolume = Number(item.price) * Number(item.quantity);
        switch (item.coinCurrencyID) {
            case common_1.CURRENCY_ID.BTC:
                binanceBTCvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.ETH:
                binanceETHvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.SOL:
                binanceSOLvolPrem += premiumVolume;
                break;
        }
    });
    bitcomContracts.forEach(item => {
        const premiumVolume = Number(item.price) * Number(item.quantity);
        switch (item.coinCurrencyID) {
            case common_1.CURRENCY_ID.BTC:
                bitcomBTCvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.ETH:
                bitcomETHvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.SOL:
                bitcomSOLvolPrem += premiumVolume;
                break;
        }
    });
    bybitContracts.forEach(item => {
        const premiumVolume = Number(item.orderPrice) * Number(item.positionQuantity);
        switch (item.coinCurrencyID) {
            case common_1.CURRENCY_ID.BTC:
                bybitBTCvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.ETH:
                bybitETHvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.SOL:
                bybitSOLvolPrem += premiumVolume;
                break;
        }
    });
    deribitContracts.forEach(item => {
        const premiumVolume = Number(item.price) * Number(item.amount);
        switch (item.coinCurrencyID) {
            case common_1.CURRENCY_ID.BTC:
                deribitBTCvolPrem += premiumVolume * btcSpotValue;
                break;
            case common_1.CURRENCY_ID.ETH:
                deribitETHvolPrem += premiumVolume * ethSpotValue;
                break;
            case common_1.CURRENCY_ID.SOL:
                deribitSOLvolPrem += premiumVolume * solSpotValue;
                break;
        }
    });
    okexContracts.forEach(item => {
        const premiumVolume = Number(item.price) * Number(item.quantity);
        switch (item.coinCurrencyID) {
            case common_1.CURRENCY_ID.BTC:
                okexBTCvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.ETH:
                okexETHvolPrem += premiumVolume;
                break;
            case common_1.CURRENCY_ID.SOL:
                okexSOLvolPrem += premiumVolume;
                break;
        }
    });
    return {
        binanceBTCvolPrem,
        binanceETHvolPrem,
        binanceSOLvolPrem,
        bitcomBTCvolPrem,
        bitcomETHvolPrem,
        bitcomSOLvolPrem,
        bybitBTCvolPrem,
        bybitETHvolPrem,
        bybitSOLvolPrem,
        deribitBTCvolPrem,
        deribitETHvolPrem,
        deribitSOLvolPrem,
        okexBTCvolPrem,
        okexETHvolPrem,
        okexSOLvolPrem
    };
}
async function _insertPremiumVolume(conn, coinCurrencyID, exchangeID, timestamp, value) {
    try {
        await (0, volumePremium_1.insert)(conn, coinCurrencyID, exchangeID, timestamp, value);
    }
    catch (err) {
        throw err;
    }
    return;
}
