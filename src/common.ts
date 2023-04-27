export const CURRENCY_ID = {
  BTC: 1,
  ETH: 2,
  SOL: 3
};

export const EXCHANGE_ID = {
  BYBIT: 1,
  BINANCE: 2,
  BITCOM: 3,
  DERIBIT: 4,
  OKEX: 5
};

export const DATEFORMAT = "YYYY-MM-DD";

export const binanceSymbolCachePrefix = "binance-symbol:";
export const binanceSymbolCacheExpirySecs = 43200; // 12 hours

export const bitcomInstrumentCachePrefix = "bitcom-inst:";
export const bitcomInstrumentCacheExpirySecs = 43200; // 12 hours

export const deribitInstrumentCachePrefix = "deribit-inst:";
export const deribitInstrumentCacheExpirySecs = 43200; // 12 hours

export const okexLastBlockTradeIDKey = "okex-lastrecvblocktradeid";

export const binance = {
  wsURL: "wss://nbstream.binance.com/eoptions/stream",
  indexPriceURL: "https://eapi.binance.com/eapi/v1/index",
  markPriceURL: "https://eapi.binance.com/eapi/v1/mark",
  tickerURL: "https://eapi.binance.com/eapi/v1/ticker",
  tickerPriceURL: "https://api.binance.com/api/v3/ticker/price",
  openInterestURL: "https://eapi.binance.com/eapi/v1/openInterest"
};

export const bybit = {
  optionWsURL: "wss://stream.bytick.com/option/usdc/public/v3",
  spotWsURL: "wss://stream.bybit.com/v5/public/spot",
  linearWsURL: "wss://stream.bybit.com/v5/public/linear",
  inverseWsURL: "wss://stream.bybit.com/v5/public/inverse",
  tickerURL: "https://api.bytick.com/v5/market/tickers"
};

export const bitcom = {
  wsURL: "wss://ws.bit.com",
  instrumentURL: "https://api.bit.com/linear/v1/instruments",
  tickerURL: "https://api.bit.com/linear/v1/tickers",
  marketTradeURL: "https://api.bit.com/linear/v1/market/trades"
};

export const deribit = {
  wsURL: "wss://www.deribit.com/ws/api/v2",
  openInterestURL: "https://deribit.com/api/v2/public/get_book_summary_by_currency",
  instrumentsURL: "https://deribit.com/api/v2/public/get_instruments",
  tickerURL: "https://deribit.com/api/v2/public/ticker"
};

export const okex = {
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

// sample new exchange
// export const newExchange = {
  // wsURL: "wss://{new_exchange}:8443/webscoket", 
  // instrumentURL: "https://{new_exchange}/v1/instruments",
  // tickerURL: "https://{new_exchange}/v1/tickers"
// }


export const dbPoolConfig = {
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