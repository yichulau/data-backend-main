"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const volumeNotional_1 = require("../resource/volumeNotional.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
async function default_1(req, res, next) {
    let result = [];
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    try {
        result = await (0, volumeNotional_1.get)(null, coinCurrencyID, exchangeID);
    }
    catch (err) {
        console.error(err);
        return next({
            status: 500
        });
    }
    res.send({ result });
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
