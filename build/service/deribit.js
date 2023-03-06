"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTicker = exports.getInstruments = exports.getBookSummaryByCurrency = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("../common.js");
async function getBookSummaryByCurrency(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.deribit.openInterestURL,
            params: {
                currency: params.coinCurrency,
                kind: "option"
            }
        });
        return data.result;
    }
    catch (err) {
        throw err;
    }
}
exports.getBookSummaryByCurrency = getBookSummaryByCurrency;
async function getInstruments(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.deribit.instrumentsURL,
            params: {
                currency: params.coinCurrency,
                kind: "option"
            }
        });
        return data.result;
    }
    catch (err) {
        throw err;
    }
}
exports.getInstruments = getInstruments;
async function getTicker(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.deribit.tickerURL,
            params: {
                instrument_name: params.instrumentName
            }
        });
        return data.result;
    }
    catch (err) {
        throw err;
    }
}
exports.getTicker = getTicker;
