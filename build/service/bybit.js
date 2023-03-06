"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTicker = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("../common.js");
async function getTicker(params) {
    try {
        const { data } = await (0, axios_1.default)({
            method: "get",
            url: common_1.bybit.tickerURL,
            params: {
                category: "option",
                baseCoin: params.coinCurrency
            }
        });
        if (data.retCode !== 0) {
            throw data;
        }
        return data.result.list;
    }
    catch (err) {
        throw err;
    }
}
exports.getTicker = getTicker;
