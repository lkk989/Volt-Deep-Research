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

const providerSchema = z.enum(['fred', 'worldbank', 'tradingeconomics'])

const requestOptionsSchema = z
    .object({
        timeoutMs: z.number().int().min(1000).max(60000).default(15000),
        retries: z.number().int().min(0).max(8).default(3),
        retryDelayMs: z.number().int().min(100).max(10000).default(700),
    })
    .default({ timeoutMs: 15000, retries: 3, retryDelayMs: 700 })

const fredApiKey = () => process.env.FRED_API_KEY

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
            'User-Agent': 'mastervolt-economic-tools/1.0',
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

export const economicIndicatorTool = createTool({
    name: 'economic_indicator',
    description:
        'Fetch economic indicator data from FRED (Federal Reserve Economic Data). Requires FRED_API_KEY environment variable.',
    tags: ['economic', 'indicator', 'fred', 'macro-data'],
    parameters: z.object({
        seriesId: z
            .string()
            .describe('FRED series ID, e.g. GDP, CPIAUCSL, UNRATE, FEDFUNDS'),
        observationStart: z
            .string()
            .optional()
            .describe('Start date in YYYY-MM-DD format'),
        observationEnd: z
            .string()
            .optional()
            .describe('End date in YYYY-MM-DD format'),
        limit: z.number().int().min(1).max(10000).default(1000),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        seriesId: z.string(),
        title: z.string(),
        frequency: z.string(),
        units: z.string(),
        lastUpdated: z.string(),
        observationCount: z.number(),
        observations: z.array(
            z.object({
                date: z.string(),
                value: z.number().nullable(),
            })
        ),
    }),
    hooks: hooksFor('economic_indicator'),
    execute: async (
        { seriesId, observationStart, observationEnd, limit, requestOptions },
        context
    ) => {
        ensureActive(context)
        const apiKey = fredApiKey()
        if (!apiKey) {
            throw new Error('Missing FRED_API_KEY environment variable')
        }

        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const [seriesResponse, obsResponse] = await Promise.all([
            client.get<{
                seriess: Array<{
                    id: string
                    title: string
                    frequency: string
                    units: string
                    last_updated: string
                }>
            }>('https://api.stlouisfed.org/fred/series', {
                params: {
                    series_id: seriesId,
                    api_key: apiKey,
                    file_type: 'json',
                },
                signal: context?.abortController?.signal,
            }),
            client.get<{
                observations: Array<{
                    date: string
                    value: string
                }>
            }>('https://api.stlouisfed.org/fred/series/observations', {
                params: {
                    series_id: seriesId,
                    api_key: apiKey,
                    file_type: 'json',
                    observation_start: observationStart,
                    observation_end: observationEnd,
                    limit,
                    sort_order: 'desc',
                },
                signal: context?.abortController?.signal,
            }),
        ])

        const series = seriesResponse.data.seriess[0]
        if (!series) {
            throw new Error(`Series ${seriesId} not found`)
        }

        const observations = obsResponse.data.observations
            .map((obs) => ({
                date: obs.date,
                value: obs.value === '.' ? null : Number(obs.value),
            }))
            .filter((obs) => obs.value !== null && Number.isFinite(obs.value))

        return {
            seriesId: series.id,
            title: series.title,
            frequency: series.frequency,
            units: series.units,
            lastUpdated: series.last_updated,
            observationCount: observations.length,
            observations,
        }
    },
})

export const economicSearchTool = createTool({
    name: 'economic_search',
    description:
        'Search for economic indicators in FRED database by keyword. Requires FRED_API_KEY environment variable.',
    tags: ['economic', 'search', 'fred', 'macro-data'],
    parameters: z.object({
        searchText: z
            .string()
            .describe(
                'Search keywords, e.g. "unemployment rate", "GDP", "inflation"'
            ),
        limit: z.number().int().min(1).max(1000).default(20),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        results: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                frequency: z.string(),
                units: z.string(),
                lastUpdated: z.string(),
            })
        ),
    }),
    hooks: hooksFor('economic_search'),
    execute: async ({ searchText, limit, requestOptions }, context) => {
        ensureActive(context)
        const apiKey = fredApiKey()
        if (!apiKey) {
            throw new Error('Missing FRED_API_KEY environment variable')
        }

        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            seriess: Array<{
                id: string
                title: string
                frequency: string
                units: string
                last_updated: string
            }>
        }>('https://api.stlouisfed.org/fred/series/search', {
            params: {
                search_text: searchText,
                api_key: apiKey,
                file_type: 'json',
                limit,
            },
            signal: context?.abortController?.signal,
        })

        return {
            count: data.seriess.length,
            results: data.seriess.map((s) => ({
                id: s.id,
                title: s.title,
                frequency: s.frequency,
                units: s.units,
                lastUpdated: s.last_updated,
            })),
        }
    },
})

export const worldBankIndicatorTool = createTool({
    name: 'world_bank_indicator',
    description:
        'Fetch World Bank economic indicators by country and indicator code. No API key required.',
    tags: ['economic', 'world-bank', 'macro-data', 'no-api-key', 'global'],
    parameters: z.object({
        countryCode: z
            .string()
            .default('US')
            .describe(
                'ISO 3166-1 alpha-3 country code, e.g. US, CHN, DEU, JPN'
            ),
        indicatorCode: z
            .string()
            .describe(
                'World Bank indicator code, e.g. NY.GDP.MKTP.CD (GDP), FP.CPI.TOTL.ZG (Inflation), SL.UEM.TOTL.ZS (Unemployment)'
            ),
        dateRange: z
            .string()
            .optional()
            .describe('Date range, e.g. "2010:2023" or "2020"'),
        limit: z.number().int().min(1).max(100).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        countryCode: z.string(),
        indicatorCode: z.string(),
        indicatorName: z.string(),
        observationCount: z.number(),
        observations: z.array(
            z.object({
                date: z.string(),
                value: z.number().nullable(),
            })
        ),
    }),
    hooks: hooksFor('world_bank_indicator'),
    execute: async (
        { countryCode, indicatorCode, dateRange, limit, requestOptions },
        context
    ) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            name: string
            indicator: { id: string; value: string }
            country: { id: string; value: string }
            values: Array<{
                date: string
                value: number | null
            }>
        }>(
            `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}`,
            {
                params: {
                    format: 'json',
                    date: dateRange,
                    per_page: limit,
                },
                signal: context?.abortController?.signal,
            }
        )

        const observations = data.values
            .filter((v) => v.value !== null && Number.isFinite(v.value))
            .sort((a, b) => a.date.localeCompare(b.date))

        return {
            countryCode: data.country.id,
            indicatorCode: data.indicator.id,
            indicatorName: data.indicator.value,
            observationCount: observations.length,
            observations: observations.map((v) => ({
                date: v.date,
                value: v.value,
            })),
        }
    },
})

export const worldBankCountriesTool = createTool({
    name: 'world_bank_countries',
    description:
        'Get list of countries and regions available in World Bank database. No API key required.',
    tags: ['economic', 'world-bank', 'countries', 'no-api-key', 'global'],
    parameters: z.object({
        region: z
            .string()
            .optional()
            .describe(
                'Filter by region code, e.g. EAS (East Asia), ECS (Europe), NAC (North America)'
            ),
        incomeLevel: z
            .string()
            .optional()
            .describe(
                'Filter by income level, e.g. HIC (High income), LMC (Lower middle income)'
            ),
        limit: z.number().int().min(1).max(300).default(100),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        countries: z.array(
            z.object({
                code: z.string(),
                name: z.string(),
                region: z.string(),
                incomeLevel: z.string(),
            })
        ),
    }),
    hooks: hooksFor('world_bank_countries'),
    execute: async (
        { region, incomeLevel, limit, requestOptions },
        context
    ) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            name: string
            countries: Array<{
                id: string
                name: string
                region: { id: string; value: string }
                incomeLevel: { id: string; value: string }
            }>
        }>('https://api.worldbank.org/v2/country', {
            params: {
                format: 'json',
                region: region,
                incomelevel: incomeLevel,
                per_page: limit,
            },
            signal: context?.abortController?.signal,
        })

        return {
            count: data.countries.length,
            countries: data.countries.map((c) => ({
                code: c.id,
                name: c.name,
                region: c.region.value,
                incomeLevel: c.incomeLevel.value,
            })),
        }
    },
})

export const worldBankIndicatorsListTool = createTool({
    name: 'world_bank_indicators_list',
    description:
        'Search or list World Bank indicator codes. No API key required.',
    tags: ['economic', 'world-bank', 'indicators', 'no-api-key', 'global'],
    parameters: z.object({
        query: z
            .string()
            .optional()
            .describe('Search query for indicator name'),
        source: z.number().optional().describe('Filter by source ID'),
        limit: z.number().int().min(1).max(100).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        indicators: z.array(
            z.object({
                code: z.string(),
                name: z.string(),
                source: z.string(),
            })
        ),
    }),
    hooks: hooksFor('world_bank_indicators_list'),
    execute: async ({ query, source, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const params: Record<string, string | number> = {
            format: 'json',
            per_page: limit,
        }
        if (query) params.q = query
        if (source) params.source = source

        const { data } = await client.get<{
            name: string
            indicators: Array<{
                id: string
                name: string
                source: { id: string; value: string }
            }>
        }>('https://api.worldbank.org/v2/indicator', {
            params,
            signal: context?.abortController?.signal,
        })

        return {
            count: data.indicators.length,
            indicators: data.indicators.map((i) => ({
                code: i.id,
                name: i.name,
                source: i.source.value,
            })),
        }
    },
})

export const economicReleasesTool = createTool({
    name: 'economic_releases',
    description:
        'Get latest economic data releases from FRED. Requires FRED_API_KEY environment variable.',
    tags: ['economic', 'releases', 'fred', 'macro-data'],
    parameters: z.object({
        realtimeStart: z
            .string()
            .optional()
            .describe('Real-time start date in YYYY-MM-DD format'),
        realtimeEnd: z
            .string()
            .optional()
            .describe('Real-time end date in YYYY-MM-DD format'),
        limit: z.number().int().min(1).max(1000).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        count: z.number(),
        releases: z.array(
            z.object({
                releaseId: z.number(),
                name: z.string(),
                pressRelease: z.boolean(),
                date: z.string(),
            })
        ),
    }),
    hooks: hooksFor('economic_releases'),
    execute: async (
        { realtimeStart, realtimeEnd, limit, requestOptions },
        context
    ) => {
        ensureActive(context)
        const apiKey = fredApiKey()
        if (!apiKey) {
            throw new Error('Missing FRED_API_KEY environment variable')
        }

        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            releases: Array<{
                id: number
                name: string
                press_release: boolean
                realtime_start: string
            }>
        }>('https://api.stlouisfed.org/fred/releases', {
            params: {
                api_key: apiKey,
                file_type: 'json',
                realtime_start: realtimeStart,
                realtime_end: realtimeEnd,
                limit,
            },
            signal: context?.abortController?.signal,
        })

        return {
            count: data.releases.length,
            releases: data.releases.map((r) => ({
                releaseId: r.id,
                name: r.name,
                pressRelease: r.press_release,
                date: r.realtime_start,
            })),
        }
    },
})

export const economicCategorySeriesTool = createTool({
    name: 'economic_category_series',
    description:
        'Get economic indicators by category from FRED (e.g. 125 for Population, 33904 for Interest Rates). Requires FRED_API_KEY.',
    tags: ['economic', 'category', 'fred', 'macro-data'],
    parameters: z.object({
        categoryId: z
            .number()
            .describe(
                'FRED category ID, e.g. 125 for Population, 33904 for Interest Rates'
            ),
        limit: z.number().int().min(1).max(1000).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        categoryId: z.number(),
        count: z.number(),
        series: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                frequency: z.string(),
                units: z.string(),
                lastUpdated: z.string(),
            })
        ),
    }),
    hooks: hooksFor('economic_category_series'),
    execute: async ({ categoryId, limit, requestOptions }, context) => {
        ensureActive(context)
        const apiKey = fredApiKey()
        if (!apiKey) {
            throw new Error('Missing FRED_API_KEY environment variable')
        }

        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get<{
            seriess: Array<{
                id: string
                title: string
                frequency: string
                units: string
                last_updated: string
            }>
        }>(`https://api.stlouisfed.org/fred/category/series`, {
            params: {
                category_id: categoryId,
                api_key: apiKey,
                file_type: 'json',
                limit,
            },
            signal: context?.abortController?.signal,
        })

        return {
            categoryId,
            count: data.seriess.length,
            series: data.seriess.map((s) => ({
                id: s.id,
                title: s.title,
                frequency: s.frequency,
                units: s.units,
                lastUpdated: s.last_updated,
            })),
        }
    },
})
