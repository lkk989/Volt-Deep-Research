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

const providerSchema = z.enum(['exchangerate_api', 'frankfurter', 'ratesapi'])

const requestOptionsSchema = z
    .object({
        timeoutMs: z.number().int().min(1000).max(60000).default(15000),
        retries: z.number().int().min(0).max(8).default(3),
        retryDelayMs: z.number().int().min(100).max(10000).default(700),
    })
    .default({ timeoutMs: 15000, retries: 3, retryDelayMs: 700 })

const normalizeCurrencyCode = (value: string) =>
    value.trim().toUpperCase().slice(0, 3)

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
            'User-Agent': 'mastervolt-forex-tools/1.0',
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

const selectProviders = (
    preferred: Array<z.infer<typeof providerSchema>> | undefined,
    defaults: Array<z.infer<typeof providerSchema>>
) => {
    const list = preferred && preferred.length > 0 ? preferred : defaults
    return Array.from(new Set(list))
}

const parseExchangeRateApiResponse = async (
    client: AxiosInstance,
    base: string,
    target: string,
    signal?: AbortSignal
) => {
    const { data } = await client.get<{
        result: string
        base_code: string
        target_code: string
        conversion_rate: number
        time_last_update_utc: string
    }>(`https://v6.exchangerate-api.com/v6/latest/${base}`, {
        signal,
    })

    if (data.result !== 'success') {
        throw new Error('ExchangeRate-API returned non-success result')
    }

    const rate = data.conversion_rate
    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
        throw new Error(`Invalid rate for ${base}/${target}`)
    }

    return {
        provider: 'exchangerate_api' as const,
        base: data.base_code,
        target: data.target_code,
        rate,
        timestamp: data.time_last_update_utc,
    }
}

const parseFrankfurterResponse = async (
    client: AxiosInstance,
    base: string,
    target: string,
    signal?: AbortSignal
) => {
    const { data } = await client.get<{
        base: string
        date: string
        rates: Record<string, number>
    }>(`https://api.frankfurter.app/latest`, {
        params: { from: base, to: target },
        signal,
    })

    const rate = data.rates[target]
    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
        throw new Error(`Frankfurter returned no rate for ${base}/${target}`)
    }

    return {
        provider: 'frankfurter' as const,
        base: data.base,
        target,
        rate,
        timestamp: new Date(`${data.date}T00:00:00Z`).toISOString(),
    }
}

const parseRatesApiResponse = async (
    client: AxiosInstance,
    base: string,
    target: string,
    signal?: AbortSignal
) => {
    const { data } = await client.get<{
        base: string
        date: string
        rates: Record<string, number>
    }>('https://api.ratesapi.io/api/latest', {
        params: { base, symbols: target },
        signal,
    })

    const rate = data.rates[target]
    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
        throw new Error(`RatesAPI returned no rate for ${base}/${target}`)
    }

    return {
        provider: 'ratesapi' as const,
        base: data.base,
        target,
        rate,
        timestamp: new Date(`${data.date}T00:00:00Z`).toISOString(),
    }
}

export const forexSpotRateTool = createTool({
    name: 'forex_spot_rate',
    description:
        'Fetch no-key forex spot exchange rate with fallback across multiple providers. Supports major currency pairs.',
    tags: ['forex', 'currency', 'exchange-rate', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseCurrency: z
            .string()
            .default('USD')
            .describe('Base currency code, e.g. USD, EUR, GBP'),
        targetCurrency: z
            .string()
            .default('EUR')
            .describe('Target currency code, e.g. EUR, JPY, GBP'),
        providerPreference: z.array(providerSchema).optional(),
        includeProviderAttempts: z.boolean().default(true),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseCurrency: z.string(),
        targetCurrency: z.string(),
        selectedProvider: providerSchema,
        rate: z.number(),
        timestamp: z.string(),
        attempts: z.array(
            z.object({
                provider: providerSchema,
                success: z.boolean(),
                rate: z.number().optional(),
                error: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('forex_spot_rate'),
    execute: async (
        {
            baseCurrency,
            targetCurrency,
            providerPreference,
            includeProviderAttempts,
            requestOptions,
        },
        context
    ) => {
        ensureActive(context)
        const base = normalizeCurrencyCode(baseCurrency)
        const target = normalizeCurrencyCode(targetCurrency)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const providers = selectProviders(providerPreference, [
            'exchangerate_api',
            'frankfurter',
            'ratesapi',
        ])
        const attempts: Array<{
            provider: z.infer<typeof providerSchema>
            success: boolean
            rate?: number
            error?: string
        }> = []

        for (const provider of providers) {
            try {
                const signal = context?.abortController?.signal
                const result =
                    provider === 'exchangerate_api'
                        ? await parseExchangeRateApiResponse(
                              client,
                              base,
                              target,
                              signal
                          )
                        : provider === 'frankfurter'
                          ? await parseFrankfurterResponse(
                                client,
                                base,
                                target,
                                signal
                            )
                          : await parseRatesApiResponse(
                                client,
                                base,
                                target,
                                signal
                            )

                attempts.push({ provider, success: true, rate: result.rate })

                return {
                    baseCurrency: base,
                    targetCurrency: target,
                    selectedProvider: result.provider,
                    rate: result.rate,
                    timestamp: result.timestamp,
                    attempts: includeProviderAttempts ? attempts : [],
                }
            } catch (error) {
                attempts.push({
                    provider,
                    success: false,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        throw new Error(
            `All forex providers failed: ${attempts.map((a) => `${a.provider}: ${a.error ?? 'unknown error'}`).join(' | ')}`
        )
    },
})

export const forexMultiSourceRateTool = createTool({
    name: 'forex_multi_source_rate',
    description:
        'Fetch exchange rates from multiple no-key providers and return consensus metrics (median/min/max/spread).',
    tags: ['forex', 'currency', 'consensus', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseCurrency: z.string().default('USD'),
        targetCurrency: z.string().default('EUR'),
        providers: z.array(providerSchema).optional(),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseCurrency: z.string(),
        targetCurrency: z.string(),
        timestamp: z.string(),
        quotes: z.array(
            z.object({ provider: providerSchema, rate: z.number() })
        ),
        summary: z.object({
            median: z.number(),
            min: z.number(),
            max: z.number(),
            spreadPercent: z.number(),
        }),
    }),
    hooks: hooksFor('forex_multi_source_rate'),
    execute: async (
        { baseCurrency, targetCurrency, providers, requestOptions },
        context
    ) => {
        ensureActive(context)
        const base = normalizeCurrencyCode(baseCurrency)
        const target = normalizeCurrencyCode(targetCurrency)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)
        const selected = selectProviders(providers, [
            'exchangerate_api',
            'frankfurter',
            'ratesapi',
        ])

        const settled = await Promise.allSettled(
            selected.map(async (provider) => {
                const signal = context?.abortController?.signal
                const result =
                    provider === 'exchangerate_api'
                        ? await parseExchangeRateApiResponse(
                              client,
                              base,
                              target,
                              signal
                          )
                        : provider === 'frankfurter'
                          ? await parseFrankfurterResponse(
                                client,
                                base,
                                target,
                                signal
                            )
                          : await parseRatesApiResponse(
                                client,
                                base,
                                target,
                                signal
                            )
                return { provider, rate: result.rate }
            })
        )

        const quotes = settled
            .filter(
                (
                    s
                ): s is PromiseFulfilledResult<{
                    provider: z.infer<typeof providerSchema>
                    rate: number
                }> => s.status === 'fulfilled'
            )
            .map((s) => s.value)

        if (quotes.length === 0) {
            throw new Error('No forex provider returned a valid quote')
        }

        const rates = quotes.map((q) => q.rate).sort((a, b) => a - b)
        const min = rates[0]
        const max = rates[rates.length - 1]
        const median =
            rates.length % 2 === 1
                ? rates[(rates.length - 1) / 2]
                : (rates[rates.length / 2 - 1] + rates[rates.length / 2]) / 2

        return {
            baseCurrency: base,
            targetCurrency: target,
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

export const forexConversionTool = createTool({
    name: 'forex_conversion',
    description:
        'Convert an amount from one currency to another using the best available rate.',
    tags: ['forex', 'currency', 'conversion', 'market-data', 'no-api-key'],
    parameters: z.object({
        amount: z.number().positive().describe('Amount to convert'),
        baseCurrency: z.string().default('USD'),
        targetCurrency: z.string().default('EUR'),
        providerPreference: z.array(providerSchema).optional(),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseCurrency: z.string(),
        targetCurrency: z.string(),
        originalAmount: z.number(),
        convertedAmount: z.number(),
        rate: z.number(),
        selectedProvider: providerSchema,
        timestamp: z.string(),
    }),
    hooks: hooksFor('forex_conversion'),
    execute: async (
        {
            amount,
            baseCurrency,
            targetCurrency,
            providerPreference,
            requestOptions,
        },
        context
    ) => {
        ensureActive(context)
        const base = normalizeCurrencyCode(baseCurrency)
        const target = normalizeCurrencyCode(targetCurrency)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const providers = selectProviders(providerPreference, [
            'exchangerate_api',
            'frankfurter',
            'ratesapi',
        ])

        for (const provider of providers) {
            try {
                const signal = context?.abortController?.signal
                const result =
                    provider === 'exchangerate_api'
                        ? await parseExchangeRateApiResponse(
                              client,
                              base,
                              target,
                              signal
                          )
                        : provider === 'frankfurter'
                          ? await parseFrankfurterResponse(
                                client,
                                base,
                                target,
                                signal
                            )
                          : await parseRatesApiResponse(
                                client,
                                base,
                                target,
                                signal
                            )

                return {
                    baseCurrency: base,
                    targetCurrency: target,
                    originalAmount: amount,
                    convertedAmount: amount * result.rate,
                    rate: result.rate,
                    selectedProvider: result.provider,
                    timestamp: result.timestamp,
                }
            } catch (error) {
                voltlogger.warn(
                    `forex_conversion provider failed: ${provider}`,
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    }
                )
            }
        }

        throw new Error(`All forex providers failed for ${base}/${target}`)
    },
})

export const forexHistoricalRateTool = createTool({
    name: 'forex_historical_rate',
    description:
        'Fetch historical exchange rate for a specific date using Frankfurter (ECB data). No API key required.',
    tags: ['forex', 'currency', 'historical', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseCurrency: z.string().default('USD'),
        targetCurrency: z.string().default('EUR'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseCurrency: z.string(),
        targetCurrency: z.string(),
        date: z.string(),
        rate: z.number(),
        timestamp: z.string(),
    }),
    hooks: hooksFor('forex_historical_rate'),
    execute: async (
        { baseCurrency, targetCurrency, date, requestOptions },
        context
    ) => {
        ensureActive(context)
        const base = normalizeCurrencyCode(baseCurrency)
        const target = normalizeCurrencyCode(targetCurrency)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            base: string
            date: string
            rates: Record<string, number>
        }>(`https://api.frankfurter.app/${date}`, {
            params: { from: base, to: target },
            signal: context?.abortController?.signal,
        })

        const rate = data.rates[target]
        if (typeof rate !== 'number' || !Number.isFinite(rate)) {
            throw new Error(
                `No historical rate available for ${base}/${target} on ${date}`
            )
        }

        return {
            baseCurrency: base,
            targetCurrency: target,
            date: data.date,
            rate,
            timestamp: new Date().toISOString(),
        }
    },
})

export const forexTimeSeriesTool = createTool({
    name: 'forex_time_series',
    description:
        'Fetch historical exchange rates for a date range using Frankfurter (ECB data). No API key required.',
    tags: [
        'forex',
        'currency',
        'time-series',
        'historical',
        'market-data',
        'no-api-key',
    ],
    parameters: z.object({
        baseCurrency: z.string().default('USD'),
        targetCurrency: z.string().default('EUR'),
        startDate: z.string().describe('Start date in YYYY-MM-DD format'),
        endDate: z.string().describe('End date in YYYY-MM-DD format'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseCurrency: z.string(),
        targetCurrency: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        pointCount: z.number(),
        rates: z.array(
            z.object({
                date: z.string(),
                rate: z.number(),
            })
        ),
    }),
    hooks: hooksFor('forex_time_series'),
    execute: async (
        { baseCurrency, targetCurrency, startDate, endDate, requestOptions },
        context
    ) => {
        ensureActive(context)
        const base = normalizeCurrencyCode(baseCurrency)
        const target = normalizeCurrencyCode(targetCurrency)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            base: string
            start_date: string
            end_date: string
            rates: Record<string, Record<string, number>>
        }>('https://api.frankfurter.app/timeseries', {
            params: {
                start_date: startDate,
                end_date: endDate,
                base,
                symbols: target,
            },
            signal: context?.abortController?.signal,
        })

        const rates = Object.entries(data.rates)
            .map(([date, ratesObj]) => ({
                date,
                rate: ratesObj[target],
            }))
            .filter(
                (r) => typeof r.rate === 'number' && Number.isFinite(r.rate)
            )
            .sort((a, b) => a.date.localeCompare(b.date))

        return {
            baseCurrency: base,
            targetCurrency: target,
            startDate: data.start_date,
            endDate: data.end_date,
            pointCount: rates.length,
            rates,
        }
    },
})

export const forexCurrenciesListTool = createTool({
    name: 'forex_currencies_list',
    description:
        'Get list of available currencies from Frankfurter API. No API key required.',
    tags: ['forex', 'currency', 'list', 'market-data', 'no-api-key'],
    parameters: z.object({
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        currencies: z.array(
            z.object({
                code: z.string(),
                name: z.string(),
            })
        ),
    }),
    hooks: hooksFor('forex_currencies_list'),
    execute: async ({ requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            base: string
            date: string
            rates: Record<string, number>
        }>('https://api.frankfurter.app/currencies', {
            signal: context?.abortController?.signal,
        })

        const currencies = Object.entries(data.rates).map(([code, _]) => ({
            code,
            name: code,
        }))

        return {
            count: currencies.length,
            currencies,
        }
    },
})

export const forexLatestBaseTool = createTool({
    name: 'forex_latest_base',
    description:
        'Fetch latest exchange rates for a base currency against all available currencies using Frankfurter. No API key required.',
    tags: ['forex', 'currency', 'latest', 'market-data', 'no-api-key'],
    parameters: z.object({
        baseCurrency: z.string().default('USD'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        baseCurrency: z.string(),
        date: z.string(),
        count: z.number(),
        rates: z.record(z.string(), z.number()),
    }),
    hooks: hooksFor('forex_latest_base'),
    execute: async ({ baseCurrency, requestOptions }, context) => {
        ensureActive(context)
        const base = normalizeCurrencyCode(baseCurrency)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            base: string
            date: string
            rates: Record<string, number>
        }>(`https://api.frankfurter.app/latest`, {
            params: { from: base },
            signal: context?.abortController?.signal,
        })

        return {
            baseCurrency: data.base,
            date: data.date,
            count: Object.keys(data.rates).length,
            rates: data.rates,
        }
    },
})
