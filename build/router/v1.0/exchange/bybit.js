"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const instrument_1 = __importDefault(require("../../../controller/instrument.js"));
const instrumentDetails_1 = __importDefault(require("../../../controller/instrumentDetails.js"));
const volumePremium_1 = __importDefault(require("../../../controller/volumePremium.js"));
const volumeNotional_1 = __importDefault(require("../../../controller/volumeNotional.js"));
const contractsTraded_1 = __importDefault(require("../../../controller/contractsTraded.js"));
const openInterest_1 = __importDefault(require("../../../controller/openInterest.js"));
const optionChart_1 = __importDefault(require("../../../controller/optionChart.js"));
const common_1 = require("../../../common.js");
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    req._exchangeID = common_1.EXCHANGE_ID.BYBIT;
    next();
});
router.get("/instrument", instrument_1.default);
router.get("/instrument/:instrumentName", instrumentDetails_1.default);
router.get("/volume-premium", volumePremium_1.default);
router.get("/volume-notional", volumeNotional_1.default);
router.get("/contracts-traded", contractsTraded_1.default);
router.get("/open-interest", openInterest_1.default);
router.get("/option-chart", optionChart_1.default);
exports.default = router;
