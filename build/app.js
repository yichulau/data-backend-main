"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const requestLog_1 = __importDefault(require("./middleware/requestLog.js"));
const index_1 = __importDefault(require("./router/index.js"));
const errHandler_1 = __importDefault(require("./middleware/errHandler.js"));
const port = Number(process.env.PORT);
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(requestLog_1.default);
app.use("/api", index_1.default);
app.use(errHandler_1.default);
app.use("*", (req, res) => {
    console.log(`${req._urlLog} -- INVALID URL`);
    res.status(404).send();
});
app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
