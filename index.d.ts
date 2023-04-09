import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
  // for cache
  type BinanceSymbolCacheValues = {
    symbol: string,
    openInterest: number,
    iv: number | null,
    delta: number | null,
    gamma: number | null
  };

  // for cache
  type BitcomInstCacheValues = {
    instrumentID: string,
    openInterest: number,
    tradingVolume: number,
    lastPrice: number,
    net: number,
    bid: number,
    ask: number,
    vol: number,
    iv: number,
    delta: number,
    gamma: number;
  };

  // for cache
  type DeribitTickerCacheValues = {
    instrumentName: string,
    lastPrice: number,
    net: number,
    bid: number,
    ask: number,
    vol: number,
    iv: number,
    delta: number,
    gamma: number;
  };

  interface ExpiryValues {
    expiry: string,
    callOITotal: number,
    putOITotal: number,
    callVolTotal: number,
    putVolTotal: number;
  }

  interface StrikeValues {
    strike: number,
    callOITotal: number,
    putOITotal: number,
    callVolTotal: number,
    putVolTotal: number;
  }

  interface ExpiryDataResult {
    expiryData: ExpiryValues[],
    strikeData: StrikeValues[];
  };

  interface OptionChartResult extends ExpiryDataResult {
    expiryList: string[],
    strikeList: number[];
  }

  type ExpiryGammaData = {
    strike: number,
    callLastPrice?: number,
    callNet?: number,
    callBid?: number,
    callAsk?: number,
    callVol?: number,
    callIV?: number,
    callDelta?: number,
    callGamma?: number,
    callOpenInterest?: number,
    putLastPrice?: number,
    putNet?: number,
    putBid?: number,
    putAsk?: number,
    putVol?: number,
    putIV?: number,
    putDelta?: number,
    putGamma?: number,
    putOpenInterest?: number;
  };

  type GammaData = {
    expiry: string,
    data: ExpiryGammaData[];
  };

  interface IRequest extends Request {
    _reqTime?: number, // unix timestamp in ms
    _urlLog?: string,
    _coinCurrencyID?: number;
    _exchangeID?: number;
  }

  interface IJwtPayload extends JwtPayload {
    access?: string,
    cd?: string;
  }

  interface BinanceTickerResult {
    symbol: string,
    priceChange: string,
    priceChangePercent: string,
    lastPrice: string,
    lastQty: string,
    open: string,
    high: string,
    low: string,
    volume: string,
    amount: string,
    bidPrice: string,
    askPrice: string,
    openTime: number,
    closeTime: number,
    firstTradeId: number,
    tradeCount: number,
    strikePrice: string,
    exercisePrice: string;
  }

  interface BinanceIndexPriceParams {
    coinCurrencyPair: "BTCUSDT" | "ETHUSDT";
  }

  interface BinanceMarkPriceParams {
    instrumentID: string;
  }

  interface BinanceMarkPriceResult {
    symbol: string,
    markPrice: string,
    bidIV: string,
    askIV: string,
    markIV: string,
    delta: string,
    theta: string,
    gamma: string,
    vega: string,
    highPriceLimit: string,
    lowPriceLimit: string;
  }

  interface BinanceOIParams {
    coinCurrency: "BTC" | "ETH" | "SOL",
    expiration: string;
  }

  interface BinanceOIResult {
    symbol: string,
    sumOpenInterest: string,
    sumOpenInterestUsd: string,
    timestamp: string;
  }

  interface BitcomInstrumentResult {
    instrument_id: string,
    created_at: number,
    updated_at: number,
    base_currency: "BTC" | "ETH",
    quote_currency: "USD",
    strike_price: string,
    expiration_at: number,
    option_type: "call" | "put",
    category: "option",
    min_price: string,
    max_price: string,
    price_step: string,
    min_size: string,
    size_step: string,
    delivery_fee_rate: string,
    contract_size: string,
    contract_size_currency: "BTC" | "ETH",
    active: boolean,
    display_at: number;
  }

  interface BitcomTickerParams {
    instrumentID: string;
  }

  interface BitcomTickerResult {
    time: number,
    instrument_id: string,
    best_bid: string,
    best_ask: string,
    best_bid_qty: string,
    ask_sigma: string,
    bid_sigma: string,
    last_price: string,
    last_qty: string,
    open24h: string,
    high24h: string,
    low24h: string,
    price_change24h: string,
    volume24h: string,
    open_interest: string,
    underlying_name: string,
    underlying_price: string,
    mark_price: string,
    index_price: string,
    sigma: string,
    delta: string,
    vega: string,
    theta: string,
    gamma: string,
    min_sell: string,
    max_buy: string;
  }

  interface BitcomMarketTradeParams {
    coinCurrencyPair: "BTC-USD" | "ETH-USD";
  }

  interface BitcomMarketTradeResult {
    created_at: number,
    trade_id: number,
    instrument_id: string,
    price: string,
    qty: string,
    side: "buy" | "sell",
    sigma: string,
    index_price: string,
    underlying_price: string,
    is_block_trade: boolean,
    display_name: string;
  }

  interface BybitTickerParams {
    coinCurrency: "BTC" | "ETH" | "SOL";
  }

  interface BybitTickerResult {
    symbol: string,
    bid1Price: string,
    bid1Size: string,
    bid1Iv: string,
    ask1Price: string,
    ask1Size: string,
    ask1Iv: string,
    lastPrice: string,
    highPrice24h: string,
    lowPrice24h: string,
    markPrice: string,
    indexPrice: string,
    markIv: string,
    underlyingPrice: string,
    openInterest: string,
    turnover24h: string,
    volume24h: string,
    totalVolume: string,
    totalTurnover: string,
    delta: string,
    gamma: string,
    vega: string,
    theta: string,
    predictedDeliveryPrice: string,
    change24h: string;
  }

  interface DeribitBookSummaryParams {
    coinCurrency: "BTC" | "ETH";
  }

  interface DeribitBookSummaryResult {
    volume_usd: number,
    volume: number,
    quote_currency: string,
    price_change: number,
    open_interest: number,
    mid_price: number | null,
    mark_price: number,
    low: number,
    last: number,
    instrument_name: string,
    high: number,
    funding_8h: number,
    estimated_delivery_price: number,
    current_funding: number,
    creation_timestamp: number,
    bid_price: number | null,
    base_currency: "BTC" | "ETH",
    ask_price: number | null;
  }

  interface DeribitInstrumentsParams {
    coinCurrency: "BTC" | "ETH";
  }

  interface DeribitInstrumentsResult {
    tick_size: number,
    taker_commission: number,
    strike: number,
    settlement_period: string,
    settlement_currency: string,
    rfq: boolean,
    quote_currency: "BTC" | "ETH",
    price_index: "btc_usd" | "eth_usd",
    option_type: "call" | "put",
    min_trade_amount: number,
    maker_commission: number,
    kind: "option",
    is_active: true,
    instrument_name: string,
    instrument_id: string,
    expiration_timestamp: number, // unix timestamp in ms
    creation_timestamp: number, // unix timestamp in ms
    counter_currency: "USD",
    contract_size: number,
    block_trade_tick_size: number,
    block_trade_min_trade_amount: number,
    block_trade_commission: number,
    base_currency: "BTC" | "ETH";
  }

  interface DeribitTickerParams {
    instrumentName: string;
  }

  interface DeribitTickerResult {
    underlying_price: number,
    underlying_index: string,
    timestamp: number, // unix timestamp in ms
    stats: {
      volume: number | null,
      price_change: number | null,
      low: number | null,
      high: number | null;
    },
    state: "open" | "closed",
    settlement_price: number,
    open_interest: number,
    min_price: number,
    max_price: number,
    mark_price: number,
    mark_iv: number,
    last_price: number | null,
    interest_rate: number,
    instrument_name: string,
    index_price: number,
    greeks: {
      vega: number,
      theta: number,
      rho: number,
      gamma: number,
      delta: number;
    },
    estimated_delivery_price: number,
    bid_iv: number,
    best_bid_price: number,
    best_bid_amount: number,
    best_ask_price: number,
    best_ask_amount: number,
    ask_iv: number;
  }

  interface OKEXTickerParams {
    coinCurrencyPair: "BTC-USD" | "ETH-USD";
  }

  interface OKEXTickerResult {
    instType: "OPTION",
    instId: string,
    last: string,
    lastSz: string,
    askPx: string,
    askSz: string,
    bidPx: string,
    bidSz: string,
    open24h: string,
    high24h: string,
    low24h: string,
    volCcy24h: string,
    vol24h: string,
    ts: string,
    sodUtc0: string,
    sodUtc8: string;
  }

  interface OKEXOptSummaryParams {
    coinCurrencyPair: "BTC-USD" | "ETH-USD";
  }

  interface OKEXOptSummaryResult {
    instType: "OPTION",
    askVol: string,
    bidVol: string,
    delta: string,
    deltaBS: string,
    fwdPx: string,
    gamma: string,
    gammaBS: string,
    instId: string,
    lever: string,
    markVol: string,
    realVol: string,
    theta: string,
    thetaBS: string,
    ts: string,
    uly: "BTC-USD" | "ETH-USD",
    vega: string,
    vegaBS: string;
  }

  interface OKEXMarkPriceParams {
    instrumentID: string;
  }

  interface OKEXOIParams {
    coinCurrencyPair: "BTC-USD" | "ETH-USD";
  }

  interface OKEXOIResult {
    instId: string,
    instType: "OPTION",
    oi: string,
    oiCcy: string,
    ts: string;
  }

  interface OKEXOIVolumeStrikeParams {
    coinCurrency: "BTC" | "ETH",
    contractExpiry: string;
  }

  interface OKEXOIVolumeExpiryParams {
    coinCurrency: "BTC" | "ETH";
  }

  interface OKEXBlockTradeParams {
    beginID: string | undefined;
  }

  interface OKEXBlockTradeLeg {
    instId: string,
    side: "buy" | "sell",
    sz: string,
    px: string,
    tradeId: string;
  }

  interface OKEXBlockTradeResult {
    blockTdId: string,
    legs: OKEXBlockTradeLeg[],
    cTime: string;
  }

  interface IResponse extends Response { }
  interface INextFunction extends NextFunction { }
}
