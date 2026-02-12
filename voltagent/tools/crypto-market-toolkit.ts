import axios, { type AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import {
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

const providerSchema = z.enum(['binance_us', 'kraken'])
const intervalSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'])

const requestOptionsSchema = z
    .object({
        timeoutMs: z.number().int().min(1000).max(60000).default(15000),
        retries: z.number().int().min(0).max(8).default(3),
        retryDelayMs: z.number().int().min(100).max(10000).default(700),
    })
    .default({ timeoutMs: 15000, retries: 3, retryDelayMs: 700 })

const krakenAssetAliasMap: Record<string, string[]> = {
    BTC: ['XBT', 'BTC'],
    ETH: ['ETH'],
    SOL: ['SOL'],
    BNB: ['BNB'],
    XRP: ['XRP'],
    ADA: ['ADA'],
    DOGE: ['XDG', 'DOGE'],
    AVAX: ['AVAX'],
    DOT: ['DOT'],
    LINK: ['LINK'],
    LTC: ['LTC'],
    BCH: ['BCH'],
    TRX: ['TRX'],
    ATOM: ['ATOM'],
    UNI: ['UNI'],
    MATIC: ['MATIC', 'POL'],
    POL: ['POL', 'MATIC'],
    TON: ['TON'],
    SHIB: ['SHIB'],
    PEPE: ['PEPE'],
    XLM: ['XLM'],
    ETC: ['ETC'],
    NEAR: ['NEAR'],
    FIL: ['FIL'],
    AAVE: ['AAVE'],
    INJ: ['INJ'],
    ARB: ['ARB'],
    OP: ['OP'],
    SUI: ['SUI'],
    APT: ['APT'],
    SEI: ['SEI'],
    RUNE: ['RUNE'],
    ALGO: ['ALGO'],
    VET: ['VET'],
    ICP: ['ICP'],
    FET: ['FET'],
    RENDER: ['RENDER', 'RNDR'],
    RNDR: ['RNDR', 'RENDER'],
    GRT: ['GRT'],
    SAND: ['SAND'],
    MANA: ['MANA'],
    THETA: ['THETA'],
    EGLD: ['EGLD'],
    KAS: ['KAS'],
    HBAR: ['HBAR'],
    QNT: ['QNT'],
    FLOW: ['FLOW'],
    STX: ['STX'],
    TAO: ['TAO'],
    IMX: ['IMX'],
    PENDLE: ['PENDLE'],

    USD: ['USD', 'ZUSD'],
    USDT: ['USDT'],
    USDC: ['USDC'],
    EUR: ['EUR', 'ZEUR'],
    GBP: ['GBP', 'ZGBP'],
    JPY: ['JPY', 'ZJPY'],
    CHF: ['CHF', 'ZCHF'],
    AUD: ['AUD', 'ZAUD'],
    CAD: ['CAD', 'ZCAD'],
}

const getKrakenAssetAliases = (asset: string) => {
    const normalized = normalizeSymbol(asset)
    return krakenAssetAliasMap[normalized] ?? [normalized]
}

const buildKrakenPairCandidates = (baseAsset: string, quoteAsset: string) => {
    const baseAliases = getKrakenAssetAliases(baseAsset)
    const quoteAliases = getKrakenAssetAliases(quoteAsset)
    const pairs: string[] = []

    for (const b of baseAliases) {
        for (const q of quoteAliases) {
            pairs.push(`${b}${q}`)
        }
    }

    return Array.from(new Set(pairs))
}

const krakenIntervalMap: Record<z.infer<typeof intervalSchema>, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
    '1w': 10080,
}

const normalizeSymbol = (value: string) =>
    value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const hooksFor = (name: string) => ({
    onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
        voltlogger.info(`${name}: start`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
            args,
        })
    },
    onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
        if (error) {
            voltlogger.error(`${name}: error`, {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                error: error instanceof Error ? error.message : String(error),
            })
            return undefined
        }
        voltlogger.info(`${name}: end`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
        })
        return undefined
    },
})

const buildHttpClient = (options: z.infer<typeof requestOptionsSchema>) => {
    const client = axios.create({
        timeout: options.timeoutMs,
        headers: {
            'User-Agent': 'mastervolt-crypto-tools/1.0',
            Accept: 'application/json, text/plain, */*',
        },
    })

    axiosRetry(client, {
        retries: options.retries,
        retryDelay: () => options.retryDelayMs,
        retryCondition: (error) => {
            const status = error.response?.status
            if (status === 429) {
                return true
            }
            if (status !== undefined && status >= 500) {
                return true
            }
            return axiosRetry.isNetworkOrIdempotentRequestError(error)
        },
    })

    return client
}

const parseBinancePrice = async (
    client: AxiosInstance,
    baseAsset: string,
    quoteAsset: string,
    signal?: AbortSignal
) => {
    const symbol = `${baseAsset}${quoteAsset}`
    const { data } = await client.get<{ symbol: string; price: string }>(
        'https://api.binance.us/api/v3/ticker/price',
        { params: { symbol }, signal }
    )
    return {
        provider: 'binance_us' as const,
        symbol: data.symbol,
        price: Number(data.price),
    }
}

const parseKrakenPrice = async (
    client: AxiosInstance,
    baseAsset: string,
    quoteAsset: string,
    signal?: AbortSignal
) => {
    const candidates = buildKrakenPairCandidates(baseAsset, quoteAsset)
    let lastError: string | undefined

    for (const pair of candidates) {
        try {
            const { data } = await client.get<{
                error: string[]
                result: Record<string, { c: [string, string] }>
            }>('https://api.kraken.com/0/public/Ticker', {
                params: { pair },
                signal,
            })

            if (data.error.length > 0) {
                lastError = data.error.join('; ')
                continue
            }

            const first = Object.values(data.result)[0]
            if (!first?.c?.[0]) {
                lastError = 'Kraken response missing close price'
                continue
            }

            return {
                provider: 'kraken' as const,
                symbol: pair,
                price: Number(first.c[0]),
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error)
        }
    }

    throw new Error(
        `Kraken ticker failed for ${baseAsset}/${quoteAsset}. Tried pairs: ${candidates.join(', ')}. Last error: ${lastError ?? 'unknown error'}`
    )
}

const selectProviders = (
    preferred: Array<z.infer<typeof providerSchema>> | undefined,
    defaults: Array<z.infer<typeof providerSchema>>
) => {
    const list = preferred && preferred.length > 0 ? preferred : defaults
    return Array.from(new Set(list))
}

export const cryptoSpotPriceTool = createTool({
    name: 'crypto_spot_price',
    description:
        'Fetch no-key crypto spot price with fallback across Binance US and Kraken.',
    tags: ['crypto', 'price', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseAsset: z.string().default('BTC'),
        quoteAsset: z.string().default('USD'),
        providerPreference: z.array(providerSchema).optional(),
        includeProviderAttempts: z.boolean().default(true),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseAsset: z.string(),
        quoteAsset: z.string(),
        selectedProvider: providerSchema,
        price: z.number(),
        timestamp: z.string(),
        attempts: z.array(
            z.object({
                provider: providerSchema,
                success: z.boolean(),
                price: z.number().optional(),
                error: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('crypto_spot_price'),
    execute: async (
        { baseAsset, quoteAsset, providerPreference, includeProviderAttempts, requestOptions },
        context
    ) => {
        ensureActive(context)
        const base = normalizeSymbol(baseAsset)
        const quote = normalizeSymbol(quoteAsset)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const providers = selectProviders(providerPreference, ['binance_us', 'kraken'])
        const attempts: Array<{ provider: z.infer<typeof providerSchema>; success: boolean; price?: number; error?: string }> = []

        for (const provider of providers) {
            try {
                const signal = context?.abortController?.signal
                const result = provider === 'binance_us'
                    ? await parseBinancePrice(client, base, quote, signal)
                    : await parseKrakenPrice(client, base, quote, signal)

                attempts.push({ provider, success: true, price: result.price })

                return {
                    baseAsset: base,
                    quoteAsset: quote,
                    selectedProvider: result.provider,
                    price: result.price,
                    timestamp: new Date().toISOString(),
                    attempts: includeProviderAttempts ? attempts : [],
                }
            } catch (error) {
                attempts.push({
                    provider,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                })
            }
        }

        throw new Error(
            `All providers failed: ${attempts.map((a) => `${a.provider}: ${a.error ?? 'unknown error'}`).join(' | ')}`
        )
    },
})

export const cryptoMultiSourcePriceTool = createTool({
    name: 'crypto_multi_source_price',
    description:
        'Fetch prices from multiple no-key providers and return consensus metrics (median/min/max/spread).',
    tags: ['crypto', 'price', 'consensus', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseAsset: z.string().default('BTC'),
        quoteAsset: z.string().default('USD'),
        providers: z.array(providerSchema).optional(),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseAsset: z.string(),
        quoteAsset: z.string(),
        timestamp: z.string(),
        quotes: z.array(z.object({ provider: providerSchema, price: z.number() })),
        summary: z.object({
            median: z.number(),
            min: z.number(),
            max: z.number(),
            spreadPercent: z.number(),
        }),
    }),
    hooks: hooksFor('crypto_multi_source_price'),
    execute: async ({ baseAsset, quoteAsset, providers, requestOptions }, context) => {
        ensureActive(context)
        const base = normalizeSymbol(baseAsset)
        const quote = normalizeSymbol(quoteAsset)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const selected = selectProviders(providers, ['binance_us', 'kraken'])

        const settled = await Promise.allSettled(
            selected.map(async (provider) => {
                const signal = context?.abortController?.signal
                const result = provider === 'binance_us'
                    ? await parseBinancePrice(client, base, quote, signal)
                    : await parseKrakenPrice(client, base, quote, signal)
                return { provider, price: result.price }
            })
        )

        const quotes = settled
            .filter((s): s is PromiseFulfilledResult<{ provider: z.infer<typeof providerSchema>; price: number }> => s.status === 'fulfilled')
            .map((s) => s.value)

        if (quotes.length === 0) {
            throw new Error('No provider returned a valid quote')
        }

        const prices = quotes.map((q) => q.price).sort((a, b) => a - b)
        const min = prices[0]
        const max = prices[prices.length - 1]
        const median = prices.length % 2 === 1
            ? prices[(prices.length - 1) / 2]
            : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2

        return {
            baseAsset: base,
            quoteAsset: quote,
            timestamp: new Date().toISOString(),
            quotes,
            summary: {
                median,
                min,
                max,
                spreadPercent: median === 0 ? 0 : ((max - min) / median) * 100,
            },
        }
    },
})

export const cryptoOhlcvTool = createTool({
    name: 'crypto_ohlcv',
    description:
        'Fetch no-key OHLCV candles from Binance US (primary) or Kraken (fallback).',
    tags: ['crypto', 'ohlcv', 'candles', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseAsset: z.string().default('BTC'),
        quoteAsset: z.string().default('USD'),
        interval: intervalSchema.default('1h'),
        limit: z.number().int().min(5).max(1000).default(200),
        providerPreference: z.array(z.enum(['binance_us', 'kraken'])).optional(),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseAsset: z.string(),
        quoteAsset: z.string(),
        interval: intervalSchema,
        selectedProvider: z.enum(['binance_us', 'kraken']),
        pointCount: z.number(),
        points: z.array(
            z.object({
                openTime: z.string(),
                closeTime: z.string(),
                open: z.number(),
                high: z.number(),
                low: z.number(),
                close: z.number(),
                volume: z.number(),
            })
        ),
    }),
    hooks: hooksFor('crypto_ohlcv'),
    execute: async ({ baseAsset, quoteAsset, interval, limit, providerPreference, requestOptions }, context) => {
        ensureActive(context)
        const base = normalizeSymbol(baseAsset)
        const quote = normalizeSymbol(quoteAsset)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const providers = selectProviders(providerPreference, ['binance_us', 'kraken'])

        for (const provider of providers) {
            try {
                const signal = context?.abortController?.signal
                if (provider === 'binance_us') {
                    const symbol = `${base}${quote}`
                    const { data } = await client.get<Array<unknown[]>>('https://api.binance.us/api/v3/klines', {
                        params: { symbol, interval, limit },
                        signal,
                    })

                    const points = data.map((row) => ({
                        openTime: new Date(Number(row[0])).toISOString(),
                        closeTime: new Date(Number(row[6])).toISOString(),
                        open: Number(row[1]),
                        high: Number(row[2]),
                        low: Number(row[3]),
                        close: Number(row[4]),
                        volume: Number(row[5]),
                    }))

                    return {
                        baseAsset: base,
                        quoteAsset: quote,
                        interval,
                        selectedProvider: 'binance_us' as const,
                        pointCount: points.length,
                        points,
                    }
                }

                const krakenInterval = krakenIntervalMap[interval]
                const candidates = buildKrakenPairCandidates(base, quote)
                let lastKrakenError: string | undefined

                for (const pair of candidates) {
                    try {
                        const { data } = await client.get<{
                            error: string[]
                            result: Record<string, Array<Array<string | number>>>
                        }>('https://api.kraken.com/0/public/OHLC', {
                            params: { pair, interval: krakenInterval },
                            signal,
                        })

                        if (data.error.length > 0) {
                            lastKrakenError = data.error.join('; ')
                            continue
                        }

                        const key = Object.keys(data.result).find((k) => k !== 'last')
                        if (!key) {
                            lastKrakenError = 'Kraken OHLC response missing result key'
                            continue
                        }

                        const rows = data.result[key].slice(-limit)
                        const points = rows.map((row) => ({
                            openTime: new Date(Number(row[0]) * 1000).toISOString(),
                            closeTime: new Date(Number(row[0]) * 1000 + krakenInterval * 60 * 1000).toISOString(),
                            open: Number(row[1]),
                            high: Number(row[2]),
                            low: Number(row[3]),
                            close: Number(row[4]),
                            volume: Number(row[6]),
                        }))

                        return {
                            baseAsset: base,
                            quoteAsset: quote,
                            interval,
                            selectedProvider: 'kraken' as const,
                            pointCount: points.length,
                            points,
                        }
                    } catch (error) {
                        lastKrakenError = error instanceof Error ? error.message : String(error)
                    }
                }

                throw new Error(
                    `Kraken OHLC failed for ${base}/${quote}. Tried pairs: ${candidates.join(', ')}. Last error: ${lastKrakenError ?? 'unknown error'}`
                )
            } catch (error) {
                voltlogger.warn(`crypto_ohlcv provider failed: ${provider}`, {
                    error: error instanceof Error ? error.message : String(error),
                })
            }
        }

        throw new Error('Failed to fetch OHLCV data from all configured providers')
    },
})

export const binanceExchangeInfoTool = createTool({
    name: 'binance_exchange_info',
    description:
        'Get Binance US exchange metadata (symbols, filters, status, permissions). No API key required.',
    tags: ['crypto', 'binance', 'exchange-info', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().optional().describe('Optional symbol like BTCUSDT'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        timezone: z.string(),
        serverTime: z.number(),
        symbolCount: z.number(),
        symbols: z.array(
            z.object({
                symbol: z.string(),
                status: z.string(),
                baseAsset: z.string(),
                quoteAsset: z.string(),
            })
        ),
    }),
    hooks: hooksFor('binance_exchange_info'),
    execute: async ({ symbol, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = symbol ? normalizeSymbol(symbol) : undefined

        const { data } = await client.get<{
            timezone: string
            serverTime: number
            symbols: Array<{ symbol: string; status: string; baseAsset: string; quoteAsset: string }>
        }>('https://api.binance.us/api/v3/exchangeInfo', {
            params: normalized ? { symbol: normalized } : undefined,
            signal: context?.abortController?.signal,
        })

        return {
            timezone: data.timezone,
            serverTime: data.serverTime,
            symbolCount: data.symbols.length,
            symbols: data.symbols,
        }
    },
})

export const binanceOrderBookTool = createTool({
    name: 'binance_order_book',
    description:
        'Fetch Binance US order book depth snapshot for a symbol. No API key required.',
    tags: ['crypto', 'binance', 'orderbook', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().describe('Symbol like BTCUSDT'),
        limit: z.number().int().min(5).max(5000).default(100),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        symbol: z.string(),
        lastUpdateId: z.number(),
        bidCount: z.number(),
        askCount: z.number(),
        bids: z.array(z.tuple([z.string(), z.string()])),
        asks: z.array(z.tuple([z.string(), z.string()])),
    }),
    hooks: hooksFor('binance_order_book'),
    execute: async ({ symbol, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = normalizeSymbol(symbol)

        const { data } = await client.get<{
            lastUpdateId: number
            bids: Array<[string, string]>
            asks: Array<[string, string]>
        }>('https://api.binance.us/api/v3/depth', {
            params: { symbol: normalized, limit },
            signal: context?.abortController?.signal,
        })

        return {
            symbol: normalized,
            lastUpdateId: data.lastUpdateId,
            bidCount: data.bids.length,
            askCount: data.asks.length,
            bids: data.bids,
            asks: data.asks,
        }
    },
})

export const binanceTicker24hrTool = createTool({
    name: 'binance_ticker_24hr',
    description:
        'Fetch Binance US 24h ticker stats for one symbol or all symbols. No API key required.',
    tags: ['crypto', 'binance', 'ticker', '24h', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().optional().describe('Optional symbol like BTCUSDT'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        tickers: z.array(
            z.object({
                symbol: z.string(),
                priceChangePercent: z.string(),
                lastPrice: z.string(),
                volume: z.string(),
            })
        ),
    }),
    hooks: hooksFor('binance_ticker_24hr'),
    execute: async ({ symbol, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = symbol ? normalizeSymbol(symbol) : undefined

        const { data } = await client.get<
            | {
                  symbol: string
                  priceChangePercent: string
                  lastPrice: string
                  volume: string
              }
            | Array<{
                  symbol: string
                  priceChangePercent: string
                  lastPrice: string
                  volume: string
              }>
        >('https://api.binance.us/api/v3/ticker/24hr', {
            params: normalized ? { symbol: normalized } : undefined,
            signal: context?.abortController?.signal,
        })

        const tickers = Array.isArray(data) ? data : [data]
        return {
            count: tickers.length,
            tickers: tickers.map((t) => ({
                symbol: t.symbol,
                priceChangePercent: t.priceChangePercent,
                lastPrice: t.lastPrice,
                volume: t.volume,
            })),
        }
    },
})

export const binanceRecentTradesTool = createTool({
    name: 'binance_recent_trades',
    description:
        'Fetch Binance US recent trades for a symbol (public endpoint).',
    tags: ['crypto', 'binance', 'trades', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().describe('Symbol like BTCUSDT'),
        limit: z.number().int().min(1).max(1000).default(100),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        symbol: z.string(),
        count: z.number(),
        trades: z.array(
            z.object({
                id: z.number(),
                price: z.string(),
                qty: z.string(),
                quoteQty: z.string().optional(),
                time: z.number(),
                isBuyerMaker: z.boolean(),
            })
        ),
    }),
    hooks: hooksFor('binance_recent_trades'),
    execute: async ({ symbol, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = normalizeSymbol(symbol)

        const { data } = await client.get<
            Array<{
                id: number
                price: string
                qty: string
                quoteQty?: string
                time: number
                isBuyerMaker: boolean
            }>
        >('https://api.binance.us/api/v3/trades', {
            params: { symbol: normalized, limit },
            signal: context?.abortController?.signal,
        })

        return {
            symbol: normalized,
            count: data.length,
            trades: data,
        }
    },
})

export const binanceAggTradesTool = createTool({
    name: 'binance_aggregate_trades',
    description:
        'Fetch Binance US aggregate trades for a symbol (public endpoint).',
    tags: ['crypto', 'binance', 'agg-trades', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().describe('Symbol like BTCUSDT'),
        limit: z.number().int().min(1).max(1000).default(100),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        symbol: z.string(),
        count: z.number(),
        trades: z.array(
            z.object({
                aggregateTradeId: z.number(),
                price: z.string(),
                quantity: z.string(),
                firstTradeId: z.number(),
                lastTradeId: z.number(),
                timestamp: z.number(),
                isBuyerMaker: z.boolean(),
            })
        ),
    }),
    hooks: hooksFor('binance_aggregate_trades'),
    execute: async ({ symbol, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = normalizeSymbol(symbol)

        const { data } = await client.get<
            Array<{
                a: number
                p: string
                q: string
                f: number
                l: number
                T: number
                m: boolean
            }>
        >('https://api.binance.us/api/v3/aggTrades', {
            params: { symbol: normalized, limit },
            signal: context?.abortController?.signal,
        })

        return {
            symbol: normalized,
            count: data.length,
            trades: data.map((t) => ({
                aggregateTradeId: t.a,
                price: t.p,
                quantity: t.q,
                firstTradeId: t.f,
                lastTradeId: t.l,
                timestamp: t.T,
                isBuyerMaker: t.m,
            })),
        }
    },
})

export const binanceBookTickerTool = createTool({
    name: 'binance_book_ticker',
    description:
        'Fetch Binance US best bid/ask book ticker for one symbol or all symbols.',
    tags: ['crypto', 'binance', 'book-ticker', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().optional().describe('Optional symbol like BTCUSDT'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        tickers: z.array(
            z.object({
                symbol: z.string(),
                bidPrice: z.string(),
                bidQty: z.string(),
                askPrice: z.string(),
                askQty: z.string(),
            })
        ),
    }),
    hooks: hooksFor('binance_book_ticker'),
    execute: async ({ symbol, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = symbol ? normalizeSymbol(symbol) : undefined

        const { data } = await client.get<
            | {
                  symbol: string
                  bidPrice: string
                  bidQty: string
                  askPrice: string
                  askQty: string
              }
            | Array<{
                  symbol: string
                  bidPrice: string
                  bidQty: string
                  askPrice: string
                  askQty: string
              }>
        >('https://api.binance.us/api/v3/ticker/bookTicker', {
            params: normalized ? { symbol: normalized } : undefined,
            signal: context?.abortController?.signal,
        })

        const tickers = Array.isArray(data) ? data : [data]
        return { count: tickers.length, tickers }
    },
})

export const binanceAveragePriceTool = createTool({
    name: 'binance_average_price',
    description:
        'Fetch Binance US rolling average price for a symbol.',
    tags: ['crypto', 'binance', 'avg-price', 'market-data', 'no-api-key'],
    parameters: z.object({
        symbol: z.string().describe('Symbol like BTCUSDT'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        symbol: z.string(),
        mins: z.number(),
        price: z.string(),
    }),
    hooks: hooksFor('binance_average_price'),
    execute: async ({ symbol, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const normalized = normalizeSymbol(symbol)

        const { data } = await client.get<{ mins: number; price: string }>(
            'https://api.binance.us/api/v3/avgPrice',
            {
                params: { symbol: normalized },
                signal: context?.abortController?.signal,
            }
        )

        return {
            symbol: normalized,
            mins: data.mins,
            price: data.price,
        }
    },
})

export const cryptoDexSearchTool = createTool({
    name: 'crypto_dex_search',
    description:
        'Search DEX pairs using DexScreener public API by text query (symbol/token/address).',
    tags: ['crypto', 'dex', 'onchain', 'liquidity', 'no-api-key'],
    parameters: z.object({
        query: z.string().min(2),
        limit: z.number().int().min(1).max(25).default(10),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        query: z.string(),
        count: z.number(),
        pairs: z.array(
            z.object({
                chainId: z.string(),
                dexId: z.string(),
                pairAddress: z.string(),
                baseSymbol: z.string(),
                quoteSymbol: z.string(),
                priceUsd: z.string().optional(),
                volume24h: z.number().optional(),
                liquidityUsd: z.number().optional(),
                url: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('crypto_dex_search'),
    execute: async ({ query, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            pairs?: Array<{
                chainId: string
                dexId: string
                pairAddress: string
                baseToken?: { symbol?: string }
                quoteToken?: { symbol?: string }
                priceUsd?: string
                volume?: { h24?: number }
                liquidity?: { usd?: number }
                url?: string
            }>
        }>('https://api.dexscreener.com/latest/dex/search', {
            params: { q: query },
            signal: context?.abortController?.signal,
        })

        const pairs = (data.pairs ?? []).slice(0, limit).map((p) => ({
            chainId: p.chainId,
            dexId: p.dexId,
            pairAddress: p.pairAddress,
            baseSymbol: p.baseToken?.symbol ?? 'UNKNOWN',
            quoteSymbol: p.quoteToken?.symbol ?? 'UNKNOWN',
            priceUsd: p.priceUsd,
            volume24h: p.volume?.h24,
            liquidityUsd: p.liquidity?.usd,
            url: p.url,
        }))

        return { query, count: pairs.length, pairs }
    },
})

export const cryptoDexPairTool = createTool({
    name: 'crypto_dex_pair',
    description:
        'Fetch DEX pair detail by chain and pair address from DexScreener public API.',
    tags: ['crypto', 'dex', 'pair', 'onchain', 'no-api-key'],
    parameters: z.object({
        chainId: z.string().describe('Chain id, e.g. solana, ethereum, bsc'),
        pairAddress: z.string().describe('Pair address'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        pairs: z.array(
            z.object({
                chainId: z.string(),
                dexId: z.string(),
                pairAddress: z.string(),
                baseSymbol: z.string(),
                quoteSymbol: z.string(),
                priceUsd: z.string().optional(),
                volume24h: z.number().optional(),
                liquidityUsd: z.number().optional(),
                fdv: z.number().optional(),
                marketCap: z.number().optional(),
                url: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('crypto_dex_pair'),
    execute: async ({ chainId, pairAddress, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            pairs?: Array<{
                chainId: string
                dexId: string
                pairAddress: string
                baseToken?: { symbol?: string }
                quoteToken?: { symbol?: string }
                priceUsd?: string
                volume?: { h24?: number }
                liquidity?: { usd?: number }
                fdv?: number
                marketCap?: number
                url?: string
            }>
        }>(`https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}`, {
            signal: context?.abortController?.signal,
        })

        const pairs = (data.pairs ?? []).map((p) => ({
            chainId: p.chainId,
            dexId: p.dexId,
            pairAddress: p.pairAddress,
            baseSymbol: p.baseToken?.symbol ?? 'UNKNOWN',
            quoteSymbol: p.quoteToken?.symbol ?? 'UNKNOWN',
            priceUsd: p.priceUsd,
            volume24h: p.volume?.h24,
            liquidityUsd: p.liquidity?.usd,
            fdv: p.fdv,
            marketCap: p.marketCap,
            url: p.url,
        }))

        return { count: pairs.length, pairs }
    },
})

export const cryptoDexTokenPairsTool = createTool({
    name: 'crypto_dex_token_pairs',
    description:
        'Fetch all DEX pairs for a token address from DexScreener public API.',
    tags: ['crypto', 'dex', 'token', 'pairs', 'onchain', 'no-api-key'],
    parameters: z.object({
        tokenAddress: z.string().describe('Token contract/mint address'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        tokenAddress: z.string(),
        count: z.number(),
        pairs: z.array(
            z.object({
                chainId: z.string(),
                dexId: z.string(),
                pairAddress: z.string(),
                baseSymbol: z.string(),
                quoteSymbol: z.string(),
                priceUsd: z.string().optional(),
                liquidityUsd: z.number().optional(),
                volume24h: z.number().optional(),
                url: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('crypto_dex_token_pairs'),
    execute: async ({ tokenAddress, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            pairs?: Array<{
                chainId: string
                dexId: string
                pairAddress: string
                baseToken?: { symbol?: string }
                quoteToken?: { symbol?: string }
                priceUsd?: string
                volume?: { h24?: number }
                liquidity?: { usd?: number }
                url?: string
            }>
        }>(`https://api.dexscreener.com/token-pairs/v1/${tokenAddress}`, {
            signal: context?.abortController?.signal,
        })

        const pairs = (data.pairs ?? []).map((p) => ({
            chainId: p.chainId,
            dexId: p.dexId,
            pairAddress: p.pairAddress,
            baseSymbol: p.baseToken?.symbol ?? 'UNKNOWN',
            quoteSymbol: p.quoteToken?.symbol ?? 'UNKNOWN',
            priceUsd: p.priceUsd,
            liquidityUsd: p.liquidity?.usd,
            volume24h: p.volume?.h24,
            url: p.url,
        }))

        return { tokenAddress, count: pairs.length, pairs }
    },
})

export const cryptoDexTokenProfilesTool = createTool({
    name: 'crypto_dex_token_profiles',
    description:
        'Fetch latest token profile list from DexScreener public API.',
    tags: ['crypto', 'dex', 'profiles', 'onchain', 'no-api-key'],
    parameters: z.object({
        limit: z.number().int().min(1).max(100).default(20),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        profiles: z.array(z.record(z.string(), z.unknown())),
    }),
    hooks: hooksFor('crypto_dex_token_profiles'),
    execute: async ({ limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const { data } = await client.get<Array<Record<string, unknown>>>(
            'https://api.dexscreener.com/token-profiles/latest/v1',
            { signal: context?.abortController?.signal }
        )
        const profiles = data.slice(0, limit)
        return { count: profiles.length, profiles }
    },
})

export const cryptoDexBoostsTool = createTool({
    name: 'crypto_dex_boosts',
    description:
        'Fetch DexScreener boost feeds (latest or top).',
    tags: ['crypto', 'dex', 'boosts', 'onchain', 'no-api-key'],
    parameters: z.object({
        mode: z.enum(['latest', 'top']).default('latest'),
        limit: z.number().int().min(1).max(100).default(20),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        mode: z.enum(['latest', 'top']),
        count: z.number(),
        items: z.array(z.record(z.string(), z.unknown())),
    }),
    hooks: hooksFor('crypto_dex_boosts'),
    execute: async ({ mode, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const endpoint =
            mode === 'top'
                ? 'https://api.dexscreener.com/token-boosts/top/v1'
                : 'https://api.dexscreener.com/token-boosts/latest/v1'

        const { data } = await client.get<Array<Record<string, unknown>>>(endpoint, {
            signal: context?.abortController?.signal,
        })

        const items = data.slice(0, limit)
        return { mode, count: items.length, items }
    },
})
