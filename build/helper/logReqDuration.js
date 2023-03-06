"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(reqTime, urlLog) {
    const reqDuration = Date.now() - reqTime;
    console.log(`${urlLog} -- DONE -- ${reqDuration / 1000}s`);
}
exports.default = default_1;
