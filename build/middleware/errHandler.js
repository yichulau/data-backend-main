"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(err, req, res, next) {
    console.log(`${req._urlLog} -- ERROR -- ${err.status}`);
    res.status(err.status).send({});
}
exports.default = default_1;
