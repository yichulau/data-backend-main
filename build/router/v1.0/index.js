"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const btc_1 = __importDefault(require("../v1.0/coinCurrency/btc.js"));
const eth_1 = __importDefault(require("../v1.0/coinCurrency/eth.js"));
const sol_1 = __importDefault(require("../v1.0/coinCurrency/sol.js"));
const router = (0, express_1.Router)();
router.use("/btc", btc_1.default);
router.use("/eth", eth_1.default);
router.use("/sol", sol_1.default);
exports.default = router;
