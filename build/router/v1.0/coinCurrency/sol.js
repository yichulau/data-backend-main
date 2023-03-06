"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const spotValue_1 = __importDefault(require("../../../controller/spotValue.js"));
const all_1 = __importDefault(require("../../v1.0/exchange/all.js"));
const binance_1 = __importDefault(require("../../v1.0/exchange/binance.js"));
const bybit_1 = __importDefault(require("../../v1.0/exchange/bybit.js"));
const bitcom_1 = __importDefault(require("../../v1.0/exchange/bitcom.js"));
const deribit_1 = __importDefault(require("../../v1.0/exchange/deribit.js"));
const okex_1 = __importDefault(require("../../v1.0/exchange/okex.js"));
const common_1 = require("../../../common.js");
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    req._coinCurrencyID = common_1.CURRENCY_ID.SOL;
    next();
});
router.get("/spotval", spotValue_1.default);
router.use("/all", all_1.default);
router.use("/binance", binance_1.default);
router.use("/bybit", bybit_1.default);
router.use("/bit.com", bitcom_1.default);
router.use("/deribit", deribit_1.default);
router.use("/okex", okex_1.default);
exports.default = router;
