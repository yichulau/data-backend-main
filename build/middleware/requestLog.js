"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(req, res, next) {
    req._reqTime = Date.now();
    req._urlLog = `${req.method} -- ${req.protocol}://${req.hostname}${req.originalUrl}`;
    console.log(req._urlLog);
    next();
}
exports.default = default_1;
