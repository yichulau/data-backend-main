"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtSecret = process.env.JWT_SECRET || "";
const jwtAccess = process.env.JWT_ACCESS || "";
const jwtIat = process.env.JWT_IAT || "";
function default_1(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!jwtSecret || !jwtAccess || !jwtIat) {
        console.log("env variables not loaded");
        return next({ status: 500 });
    }
    if (!authHeader) {
        return next({ status: 401 });
    }
    jsonwebtoken_1.default.verify(authHeader, jwtSecret, (err, tokenData) => {
        if (err) {
            console.error(err);
            return next({ status: 500 });
        }
        tokenData = tokenData;
        if (tokenData.iat !== Number(jwtIat) ||
            tokenData.access !== jwtAccess ||
            tokenData.cd !== "1") {
            return next({ status: 401 });
        }
        next();
    });
}
exports.default = default_1;
