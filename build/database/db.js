"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Database_pool;
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const common_1 = require("../common.js");
const conn_1 = __importDefault(require("./conn.js"));
class Database {
    constructor() {
        _Database_pool.set(this, void 0);
        __classPrivateFieldSet(this, _Database_pool, promise_1.default.createPool(common_1.dbPoolConfig), "f");
    }
    async getConnection() {
        try {
            const conn = await __classPrivateFieldGet(this, _Database_pool, "f").getConnection();
            return new conn_1.default(conn);
        }
        catch (err) {
            throw err;
        }
    }
    async query(query, data) {
        data.forEach(item => {
            if (typeof item === "string")
                item.trim();
        });
        try {
            const result = await __classPrivateFieldGet(this, _Database_pool, "f").query(query, data);
            return result;
        }
        catch (err) {
            throw err;
        }
    }
}
_Database_pool = new WeakMap();
exports.default = new Database();
