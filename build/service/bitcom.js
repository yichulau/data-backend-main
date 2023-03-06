"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTicker = exports.getInstruments = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("../common.js");
async function getInstruments(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.bitcom.instrumentURL,
            params: {
                currency: params.coinCurrency,
                category: "option",
                active: "true"
            }
        });
        if (data.code !== 0) {
            throw data;
        }
        return data.data;
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
            url: common_1.bitcom.tickerURL,
            params: {
                instrument_id: params.instrumentID
            }
        });
        if (data.code !== 0) {
            throw data;
        }
        return data.data;
    }
    catch (err) {
        throw err;
    }
}
exports.getTicker = getTicker;
