"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gamma_1 = require("../resource/gamma.js");
const logReqDuration_1 = __importDefault(require("../helper/logReqDuration.js"));
async function default_1(req, res, next) {
    let gammaData = [];
    const coinCurrencyID = req._coinCurrencyID;
    const exchangeID = req._exchangeID;
    try {
        gammaData = await (0, gamma_1.getLatestGammaData)(null, exchangeID, coinCurrencyID);
    }
    catch (err) {
        console.error(err);
        return next({
            status: 500
        });
    }
    res.send(gammaData);
    (0, logReqDuration_1.default)(req._reqTime, req._urlLog);
}
exports.default = default_1;
