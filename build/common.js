"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPoolConfig = exports.okex = exports.deribit = exports.bitcom = exports.bybit = exports.binance = exports.okexLastBlockTradeIDKey = exports.bitcomInstrumentCacheExpirySecs = exports.bitcomInstrumentCachePrefix = exports.binanceSymbolCacheExpirySecs = exports.binanceSymbolCachePrefix = exports.DATEFORMAT = exports.EXCHANGE_ID = exports.CURRENCY_ID = void 0;
exports.CURRENCY_ID = {
    BTC: 1,
    ETH: 2,
    SOL: 3
};
exports.EXCHANGE_ID = {
    BYBIT: 1,
    BINANCE: 2,
    BITCOM: 3,
    DERIBIT: 4,
    OKEX: 5
};
exports.DATEFORMAT = "YYYY-MM-DD";
exports.binanceSymbolCachePrefix = "binance-symbol:";
exports.binanceSymbolCacheExpirySecs = 43200;
exports.bitcomInstrumentCachePrefix = "bitcom-inst:";
exports.bitcomInstrumentCacheExpirySecs = 4320;
exports.okexLastBlockTradeIDKey = "okex-lastrecvblocktradeid";
exports.binance = {
    wsURL: "wss://nbstream.binance.com/eoptions/stream",
    indexPriceURL: "https://eapi.binance.com/eapi/v1/index",
    markPriceURL: "https://eapi.binance.com/eapi/v1/mark",
    tickerURL: "https://eapi.binance.com/eapi/v1/ticker",
    tickerPriceURL: "https://api.binance.com/api/v3/ticker/price",
    openInterestURL: "https://eapi.binance.com/eapi/v1/openInterest"
};
exports.bybit = {
    optionWsURL: "wss://stream.bytick.com/option/usdc/public/v3",
    spotWsURL: "wss://stream.bybit.com/v5/public/spot",
    linearWsURL: "wss://stream.bybit.com/v5/public/linear",
    inverseWsURL: "wss://stream.bybit.com/v5/public/inverse",
    tickerURL: "https://api.bytick.com/v5/market/tickers"
};
exports.bitcom = {
    wsURL: "wss://ws.bit.com",
    instrumentURL: "https://api.bit.com/v1/instruments",
    tickerURL: "https://api.bit.com/v1/tickers",
    marketTradeURL: "https://api.bit.com/linear/v1/market/trades"
};
exports.deribit = {
    wsURL: "wss://www.deribit.com/ws/api/v2",
    openInterestURL: "https://deribit.com/api/v2/public/get_book_summary_by_currency",
    instrumentsURL: "https://deribit.com/api/v2/public/get_instruments",
    tickerURL: "https://deribit.com/api/v2/public/ticker"
};
exports.okex = {
    wsURL: "wss://ws.okx.com:8443/ws/v5/public",
    tickerURL: "https://okx.com/api/v5/market/tickers",
    tickerIndexURL: "https://okx.com/api/v5/market/index-tickers",
    openInterestURL: "https://okx.com/api/v5/public/open-interest",
    optSummaryURL: "https://okx.com/api/v5/public/opt-summary",
    markPriceURL: "https://okx.com/api/v5/public/mark-price",
    oiAndVolumeStrikeURL: "https://okx.com/api/v5/rubik/stat/option/open-interest-volume-strike",
    oiAndVolumeExpiryURL: "https://okx.com/api/v5/rubik/stat/option/open-interest-volume-expiry",
    blockTradeURL: "https://www.okx.com/api/v5/rfq/public-trades"
};
exports.dbPoolConfig = {
    multipleStatements: false,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_SCHEMA,
    connectionLimit: 10,
    ssl: {
        rejectUnauthorized: false
    },
    supportBigNumbers: true
};
