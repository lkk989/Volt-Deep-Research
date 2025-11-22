import { createTool, createToolkit } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"

const requireAlphaVantageKey = () => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    throw new Error("Missing ALPHA_VANTAGE_API_KEY environment variable")
  }
  return apiKey
}

const fetchAlphaVantageJson = async (url: URL, operationId?: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alpha Vantage HTTP ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    [key: string]: unknown
    Note?: string
    "Error Message"?: string
  }

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`)
  }

  if (data.Note) {
    voltlogger.warn(`Alpha Vantage note: ${data.Note}`, { operationId })
  }

  return data
}

const normalizeDaily = (series: Record<string, { "1. open": string; "2. high": string; "3. low": string; "4. close": string; "5. volume": string }>) =>
  Object.entries(series).map(([date, v]) => ({
    date,
    open: Number(v["1. open"]),
    high: Number(v["2. high"]),
    low: Number(v["3. low"]),
    close: Number(v["4. close"]),
    volume: Number(v["5. volume"]),
  }))

export const alphaVantageTimeSeriesDailyTool = createTool({
  name: "alpha_vantage_time_series_daily",
  description:
    "Fetch daily OHLCV time series for a symbol via TIME_SERIES_DAILY. Use for end-of-day market research.",
  parameters: z.object({
    symbol: z.string().min(1).describe("Symbol, e.g. 'AAPL'").trim(),
    outputSize: z
      .enum(["compact", "full"])
      .optional()
      .default("compact")
      .describe("'compact' (last 100 points) or 'full' (full history)"),
  }),
  execute: async ({ symbol, outputSize }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    const apiKey = requireAlphaVantageKey()

    try {
      const url = new URL("https://www.alphavantage.co/query")
      url.searchParams.set("function", "TIME_SERIES_DAILY")
      url.searchParams.set("symbol", symbol)
      url.searchParams.set("outputsize", outputSize ?? "compact")
      url.searchParams.set("datatype", "json")
      url.searchParams.set("apikey", apiKey)

      voltlogger.info(`Alpha Vantage daily for ${symbol}`, {
        operationId: context.operationId,
      })

      const data = await fetchAlphaVantageJson(url, context.operationId)
      const series = data["Time Series (Daily)"] as Record<string, { "1. open": string; "2. high": string; "3. low": string; "4. close": string; "5. volume": string }> | undefined
      if (!series) {
        throw new Error("Missing 'Time Series (Daily)' in response")
      }

      const points = normalizeDaily(series)

      return {
        symbol,
        granularity: "daily" as const,
        outputSize: outputSize ?? "compact",
        pointCount: points.length,
        points,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      voltlogger.error(`alpha_vantage_time_series_daily failed: ${message}`)
      throw new Error(`Failed to fetch Alpha Vantage daily data: ${message}`)
    }
  },
})

export const alphaVantageTimeSeriesIntradayTool = createTool({
  name: "alpha_vantage_time_series_intraday",
  description:
    "Fetch intraday OHLCV time series for a symbol via TIME_SERIES_INTRADAY. Use for short-term granular analysis.",
  parameters: z.object({
    symbol: z.string().min(1).describe("Symbol, e.g. 'AAPL'").trim(),
    interval: z
      .enum(["1min", "5min", "15min", "30min", "60min"])
      .describe("Intraday interval"),
    outputSize: z
      .enum(["compact", "full"])
      .optional()
      .default("compact")
      .describe("'compact' or 'full'"),
  }),
  execute: async ({ symbol, interval, outputSize }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    const apiKey = requireAlphaVantageKey()

    try {
      const url = new URL("https://www.alphavantage.co/query")
      url.searchParams.set("function", "TIME_SERIES_INTRADAY")
      url.searchParams.set("symbol", symbol)
      url.searchParams.set("interval", interval)
      url.searchParams.set("outputsize", outputSize ?? "compact")
      url.searchParams.set("datatype", "json")
      url.searchParams.set("apikey", apiKey)

      voltlogger.info(`Alpha Vantage intraday ${interval} for ${symbol}`, {
        operationId: context.operationId,
      })

      const data = await fetchAlphaVantageJson(url, context.operationId)
      const key = Object.keys(data).find(k => k.startsWith("Time Series"))
      const series = key
        ? (data[key] as Record<string, { "1. open": string; "2. high": string; "3. low": string; "4. close": string; "5. volume": string }>)
        : undefined
      if (!series) {
        throw new Error("Missing intraday time series in response")
      }

      const points = normalizeDaily(series)

      return {
        symbol,
        granularity: "intraday" as const,
        interval,
        outputSize: outputSize ?? "compact",
        pointCount: points.length,
        points,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      voltlogger.error(`alpha_vantage_time_series_intraday failed: ${message}`)
      throw new Error(`Failed to fetch Alpha Vantage intraday data: ${message}`)
    }
  },
})

export const alphaVantageTimeSeriesWeeklyTool = createTool({
  name: "alpha_vantage_time_series_weekly",
  description:
    "Fetch weekly OHLCV time series for a symbol via TIME_SERIES_WEEKLY. Use for medium-term trend analysis.",
  parameters: z.object({
    symbol: z.string().min(1).describe("Symbol, e.g. 'AAPL'").trim(),
  }),
  execute: async ({ symbol }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    const apiKey = requireAlphaVantageKey()

    try {
      const url = new URL("https://www.alphavantage.co/query")
      url.searchParams.set("function", "TIME_SERIES_WEEKLY")
      url.searchParams.set("symbol", symbol)
      url.searchParams.set("datatype", "json")
      url.searchParams.set("apikey", apiKey)

      voltlogger.info(`Alpha Vantage weekly for ${symbol}`, {
        operationId: context.operationId,
      })

      const data = await fetchAlphaVantageJson(url, context.operationId)
      const series = data["Weekly Time Series"] as Record<string, { "1. open": string; "2. high": string; "3. low": string; "4. close": string; "5. volume": string }> | undefined
      if (!series) {
        throw new Error("Missing 'Weekly Time Series' in response")
      }

      const points = normalizeDaily(series)

      return {
        symbol,
        granularity: "weekly" as const,
        pointCount: points.length,
        points,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      voltlogger.error(`alpha_vantage_time_series_weekly failed: ${message}`)
      throw new Error(`Failed to fetch Alpha Vantage weekly data: ${message}`)
    }
  },
})

export const alphaVantageTimeSeriesMonthlyTool = createTool({
  name: "alpha_vantage_time_series_monthly",
  description:
    "Fetch monthly OHLCV time series for a symbol via TIME_SERIES_MONTHLY. Use for long-term trend analysis.",
  parameters: z.object({
    symbol: z.string().min(1).describe("Symbol, e.g. 'AAPL'").trim(),
  }),
  execute: async ({ symbol }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    const apiKey = requireAlphaVantageKey()

    try {
      const url = new URL("https://www.alphavantage.co/query")
      url.searchParams.set("function", "TIME_SERIES_MONTHLY")
      url.searchParams.set("symbol", symbol)
      url.searchParams.set("datatype", "json")
      url.searchParams.set("apikey", apiKey)

      voltlogger.info(`Alpha Vantage monthly for ${symbol}`, {
        operationId: context.operationId,
      })

      const data = await fetchAlphaVantageJson(url, context.operationId)
      const series = data["Monthly Time Series"] as Record<string, { "1. open": string; "2. high": string; "3. low": string; "4. close": string; "5. volume": string }> | undefined
      if (!series) {
        throw new Error("Missing 'Monthly Time Series' in response")
      }

      const points = normalizeDaily(series)

      return {
        symbol,
        granularity: "monthly" as const,
        pointCount: points.length,
        points,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      voltlogger.error(`alpha_vantage_time_series_monthly failed: ${message}`)
      throw new Error(`Failed to fetch Alpha Vantage monthly data: ${message}`)
    }
  },
})

export const alphaVantageToolkit = createToolkit({
  name: "alpha_vantage_toolkit",
  description:
    "Alpha Vantage toolkit for intraday, daily, weekly, and monthly OHLCV time series to support quantitative research.",
  instructions:
    "Use these tools when you need real market data. Always check pointCount before analysis. Do not guess prices if the API returns errors or notes.",
  addInstructions: true,
  tools: [
    alphaVantageTimeSeriesDailyTool,
    alphaVantageTimeSeriesIntradayTool,
    alphaVantageTimeSeriesWeeklyTool,
    alphaVantageTimeSeriesMonthlyTool,
  ],
})
