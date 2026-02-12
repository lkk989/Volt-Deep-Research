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

const stockProviderSchema = z.enum(['yahoo', 'stooq'])
const stockIntervalSchema = z.enum(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '1wk', '1mo'])
const stockRangeSchema = z.enum([
    '1d',
    '5d',
    '1mo',
    '3mo',
    '6mo',
    '1y',
    '2y',
    '5y',
    '10y',
    'ytd',
    'max',
])

const requestOptionsSchema = z
    .object({
        timeoutMs: z.number().int().min(1000).max(60000).default(15000),
        retries: z.number().int().min(0).max(8).default(3),
        retryDelayMs: z.number().int().min(100).max(10000).default(700),
    })
    .default({ timeoutMs: 15000, retries: 3, retryDelayMs: 700 })

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const getAbortSignal = (context?: ToolExecuteOptions): AbortSignal | undefined => {
    return (context as { abortController?: AbortController } | undefined)?.abortController?.signal
}

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase().replace(/\s+/g, '')

const normalizeInterval = (interval: z.infer<typeof stockIntervalSchema>) => {
    if (interval === '1h') {
        return '60m'
    }
    return interval
}

const normalizeStockProviders = (
    providers: Array<z.infer<typeof stockProviderSchema>>
): Array<z.infer<typeof stockProviderSchema>> => {
    return Array.from(new Set(providers)) as Array<
        z.infer<typeof stockProviderSchema>
    >
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
            'User-Agent': 'mastervolt-stock-tools/1.0',
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

const toStooqSymbol = (ticker: string) => {
    const t = normalizeTicker(ticker)
    if (t.includes('.')) {
        return t.toLowerCase()
    }
    return `${t.toLowerCase()}.us`
}

const parseStooqCsv = (csv: string) => {
    const lines = csv.trim().split(/\r?\n/)
    if (lines.length <= 1) {
        return [] as Array<{
            date: string
            open: number
            high: number
            low: number
            close: number
            volume: number
        }>
    }

    const rows = lines.slice(1)
    return rows
        .map((line) => line.split(','))
        .filter((cols) => cols.length >= 6)
        .map((cols) => ({
            date: cols[0],
            open: Number(cols[1]),
            high: Number(cols[2]),
            low: Number(cols[3]),
            close: Number(cols[4]),
            volume: Number(cols[5]),
        }))
        .filter((row) => Number.isFinite(row.close))
}

const fetchYahooQuote = async (
    client: AxiosInstance,
    symbols: string[],
    signal?: AbortSignal
) => {
    const joined = symbols.map(normalizeTicker).join(',')
    const { data } = await client.get<{
        quoteResponse?: {
            result?: Array<{
                symbol: string
                shortName?: string
                longName?: string
                marketState?: string
                regularMarketPrice?: number
                regularMarketChange?: number
                regularMarketChangePercent?: number
                regularMarketVolume?: number
                regularMarketTime?: number
                currency?: string
                exchange?: string
            }>
        }
    }>('https://query1.finance.yahoo.com/v7/finance/quote', {
        params: { symbols: joined },
        signal,
    })

    return data.quoteResponse?.result ?? []
}

export const stockSpotPriceTool = createTool({
    name: 'stock_spot_price',
    description:
        'Fetch stock spot price without API key. Primary: Yahoo quote, fallback: Stooq latest daily close.',
    tags: ['stocks', 'price', 'market-data', 'no-api-key'],
    parameters: z.object({
        ticker: z.string().describe('Ticker symbol, e.g. AAPL'),
        providerPreference: z.array(stockProviderSchema).optional(),
        includeProviderAttempts: z.boolean().default(true),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        ticker: z.string(),
        selectedProvider: stockProviderSchema,
        price: z.number(),
        currency: z.string().optional(),
        timestamp: z.string(),
        attempts: z.array(
            z.object({
                provider: stockProviderSchema,
                success: z.boolean(),
                price: z.number().optional(),
                error: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('stock_spot_price'),
    execute: async ({ ticker, providerPreference, includeProviderAttempts, requestOptions }, context) => {
        ensureActive(context)
        const symbol = normalizeTicker(ticker)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const providers = normalizeStockProviders(
            providerPreference ?? ['yahoo', 'stooq']
        )

        const attempts: Array<{ provider: z.infer<typeof stockProviderSchema>; success: boolean; price?: number; error?: string }> = []

        for (const provider of providers) {
            try {
                if (provider === 'yahoo') {
                    const quotes = await fetchYahooQuote(client, [symbol], getAbortSignal(context))
                    const q = quotes[0]
                    if (!q || typeof q.regularMarketPrice !== 'number') {
                        throw new Error('Yahoo quote missing regularMarketPrice')
                    }

                    attempts.push({ provider, success: true, price: q.regularMarketPrice })
                    return {
                        ticker: symbol,
                        selectedProvider: 'yahoo' as const,
                        price: q.regularMarketPrice,
                        currency: q.currency,
                        timestamp: new Date().toISOString(),
                        attempts: includeProviderAttempts ? attempts : [],
                    }
                }

                const stooq = toStooqSymbol(symbol)
                const { data } = await client.get<string>('https://stooq.com/q/d/l/', {
                    params: { s: stooq, i: 'd' },
                    responseType: 'text',
                    signal: getAbortSignal(context),
                })

                const rows = parseStooqCsv(data)
                const last = rows[rows.length - 1]
                if (!last) {
                    throw new Error('Stooq returned no rows')
                }

                attempts.push({ provider, success: true, price: last.close })
                return {
                    ticker: symbol,
                    selectedProvider: 'stooq' as const,
                    price: last.close,
                    timestamp: new Date(`${last.date}T00:00:00Z`).toISOString(),
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
            `All stock providers failed: ${attempts.map((a) => `${a.provider}: ${a.error ?? 'unknown error'}`).join(' | ')}`
        )
    },
})

export const stockBatchQuoteTool = createTool({
    name: 'stock_batch_quote',
    description:
        'Fetch batch stock quotes from Yahoo Finance public endpoint without API key.',
    tags: ['stocks', 'quotes', 'batch', 'market-data', 'no-api-key'],
    parameters: z.object({
        tickers: z.array(z.string()).min(1).max(100),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        quotes: z.array(
            z.object({
                ticker: z.string(),
                shortName: z.string().optional(),
                exchange: z.string().optional(),
                marketState: z.string().optional(),
                price: z.number().nullable(),
                change: z.number().nullable(),
                changePercent: z.number().nullable(),
                volume: z.number().nullable(),
                currency: z.string().optional(),
                marketTime: z.number().optional(),
            })
        ),
    }),
    hooks: hooksFor('stock_batch_quote'),
    execute: async ({ tickers, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)
        const symbols = tickers.map(normalizeTicker)
        const quotes = await fetchYahooQuote(client, symbols, getAbortSignal(context))

        return {
            count: quotes.length,
            quotes: quotes.map((q) => ({
                ticker: q.symbol,
                shortName: q.shortName ?? q.longName,
                exchange: q.exchange,
                marketState: q.marketState,
                price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : null,
                change: typeof q.regularMarketChange === 'number' ? q.regularMarketChange : null,
                changePercent:
                    typeof q.regularMarketChangePercent === 'number' ? q.regularMarketChangePercent : null,
                volume: typeof q.regularMarketVolume === 'number' ? q.regularMarketVolume : null,
                currency: q.currency,
                marketTime: q.regularMarketTime,
            })),
        }
    },
})

export const stockOhlcvTool = createTool({
    name: 'stock_ohlcv',
    description:
        'Fetch OHLCV bars from Yahoo chart endpoint without API key.',
    tags: ['stocks', 'ohlcv', 'candles', 'market-data', 'no-api-key'],
    parameters: z.object({
        ticker: z.string().describe('Ticker symbol, e.g. AAPL'),
        interval: stockIntervalSchema.default('1d'),
        range: stockRangeSchema.default('1mo'),
        includeAdjustedClose: z.boolean().default(true),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        ticker: z.string(),
        interval: stockIntervalSchema,
        range: stockRangeSchema,
        currency: z.string().optional(),
        exchangeTimezoneName: z.string().optional(),
        pointCount: z.number(),
        points: z.array(
            z.object({
                openTime: z.string(),
                open: z.number().nullable(),
                high: z.number().nullable(),
                low: z.number().nullable(),
                close: z.number().nullable(),
                adjustedClose: z.number().nullable().optional(),
                volume: z.number().nullable(),
            })
        ),
    }),
    hooks: hooksFor('stock_ohlcv'),
    execute: async ({ ticker, interval, range, includeAdjustedClose, requestOptions }, context) => {
        ensureActive(context)
        const symbol = normalizeTicker(ticker)
        const normalizedInterval = normalizeInterval(interval)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            chart?: {
                result?: Array<{
                    meta?: {
                        currency?: string
                        exchangeTimezoneName?: string
                    }
                    timestamp?: number[]
                    indicators?: {
                        quote?: Array<{
                            open?: Array<number | null>
                            high?: Array<number | null>
                            low?: Array<number | null>
                            close?: Array<number | null>
                            volume?: Array<number | null>
                        }>
                        adjclose?: Array<{
                            adjclose?: Array<number | null>
                        }>
                    }
                }>
                error?: { description?: string }
            }
        }>(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
            params: { interval: normalizedInterval, range },
            signal: getAbortSignal(context),
        })

        const result = data.chart?.result?.[0]
        if (!result) {
            const err = data.chart?.error?.description ?? 'Yahoo chart returned no result'
            throw new Error(err)
        }

        const ts = result.timestamp ?? []
        const quote = result.indicators?.quote?.[0]
        if (!quote) {
            throw new Error('Yahoo chart missing quote indicators')
        }

        const adj = result.indicators?.adjclose?.[0]?.adjclose

        const points = ts.map((t, i) => ({
            openTime: new Date(t * 1000).toISOString(),
            open: quote.open?.[i] ?? null,
            high: quote.high?.[i] ?? null,
            low: quote.low?.[i] ?? null,
            close: quote.close?.[i] ?? null,
            adjustedClose: includeAdjustedClose ? adj?.[i] ?? null : undefined,
            volume: quote.volume?.[i] ?? null,
        }))

        return {
            ticker: symbol,
            interval,
            range,
            currency: result.meta?.currency,
            exchangeTimezoneName: result.meta?.exchangeTimezoneName,
            pointCount: points.length,
            points,
        }
    },
})

export const stockStooqDailyTool = createTool({
    name: 'stock_stooq_daily',
    description:
        'Fetch daily historical OHLCV from Stooq CSV endpoint without API key.',
    tags: ['stocks', 'stooq', 'historical', 'daily', 'no-api-key'],
    parameters: z.object({
        ticker: z.string().describe('Ticker symbol, e.g. AAPL or BRK.B'),
        limit: z.number().int().min(10).max(10000).default(500),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        ticker: z.string(),
        pointCount: z.number(),
        points: z.array(
            z.object({
                date: z.string(),
                open: z.number(),
                high: z.number(),
                low: z.number(),
                close: z.number(),
                volume: z.number(),
            })
        ),
    }),
    hooks: hooksFor('stock_stooq_daily'),
    execute: async ({ ticker, limit, requestOptions }, context) => {
        ensureActive(context)
        const symbol = normalizeTicker(ticker)
        const stooq = toStooqSymbol(symbol)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const { data } = await client.get<string>('https://stooq.com/q/d/l/', {
            params: { s: stooq, i: 'd' },
            responseType: 'text',
            signal: getAbortSignal(context),
        })

        const rows = parseStooqCsv(data)
        const sliced = rows.slice(-limit)

        return {
            ticker: symbol,
            pointCount: sliced.length,
            points: sliced,
        }
    },
})

export const stockMultiSourcePriceTool = createTool({
    name: 'stock_multi_source_price',
    description:
        'Fetch stock price from Yahoo and Stooq and return consensus metrics (median/min/max/spread).',
    tags: ['stocks', 'price', 'consensus', 'market-data', 'no-api-key'],
    parameters: z.object({
        ticker: z.string().describe('Ticker symbol, e.g. AAPL'),
        providers: z.array(stockProviderSchema).optional(),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        ticker: z.string(),
        timestamp: z.string(),
        quotes: z.array(
            z.object({
                provider: stockProviderSchema,
                price: z.number(),
            })
        ),
        summary: z.object({
            median: z.number(),
            min: z.number(),
            max: z.number(),
            spreadPercent: z.number(),
        }),
    }),
    hooks: hooksFor('stock_multi_source_price'),
    execute: async ({ ticker, providers, requestOptions }, context) => {
        ensureActive(context)
        const symbol = normalizeTicker(ticker)
        const selected = normalizeStockProviders(providers ?? ['yahoo', 'stooq'])
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const tasks = selected.map(async (provider) => {
            if (provider === 'yahoo') {
                const q = await fetchYahooQuote(client, [symbol], getAbortSignal(context))
                const first = q[0]
                if (!first || typeof first.regularMarketPrice !== 'number') {
                    throw new Error('Yahoo quote missing regularMarketPrice')
                }
                return { provider, price: first.regularMarketPrice }
            }

            const stooq = toStooqSymbol(symbol)
            const { data } = await client.get<string>('https://stooq.com/q/d/l/', {
                params: { s: stooq, i: 'd' },
                responseType: 'text',
                signal: getAbortSignal(context),
            })
            const rows = parseStooqCsv(data)
            const last = rows[rows.length - 1]
            if (!last) {
                throw new Error('Stooq returned no rows')
            }
            return { provider, price: last.close }
        })

        const settled = await Promise.allSettled(tasks)
        const quotes = settled
            .filter(
                (s): s is PromiseFulfilledResult<{ provider: z.infer<typeof stockProviderSchema>; price: number }> =>
                    s.status === 'fulfilled'
            )
            .map((s) => s.value)

        if (quotes.length === 0) {
            throw new Error('No stock provider returned a valid quote')
        }

        const prices = quotes.map((q) => q.price).sort((a, b) => a - b)
        const min = prices[0]
        const max = prices[prices.length - 1]
        const median =
            prices.length % 2 === 1
                ? prices[(prices.length - 1) / 2]
                : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2

        return {
            ticker: symbol,
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

export const stockSymbolSearchTool = createTool({
    name: 'stock_symbol_search',
    description:
        'Search symbols by company/name via Yahoo Finance public search endpoint.',
    tags: ['stocks', 'search', 'symbols', 'no-api-key'],
    parameters: z.object({
        query: z.string().min(1),
        quotesCount: z.number().int().min(1).max(50).default(15),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        query: z.string(),
        count: z.number(),
        results: z.array(
            z.object({
                symbol: z.string(),
                shortname: z.string().optional(),
                longname: z.string().optional(),
                exchDisp: z.string().optional(),
                typeDisp: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('stock_symbol_search'),
    execute: async ({ query, quotesCount, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? { timeoutMs: 15000, retries: 3, retryDelayMs: 700 }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            quotes?: Array<{
                symbol: string
                shortname?: string
                longname?: string
                exchDisp?: string
                typeDisp?: string
            }>
        }>('https://query2.finance.yahoo.com/v1/finance/search', {
            params: { q: query, quotesCount },
            signal: getAbortSignal(context),
        })

        const results = (data.quotes ?? []).map((q) => ({
            symbol: q.symbol,
            shortname: q.shortname,
            longname: q.longname,
            exchDisp: q.exchDisp,
            typeDisp: q.typeDisp,
        }))

        return { query, count: results.length, results }
    },
})
