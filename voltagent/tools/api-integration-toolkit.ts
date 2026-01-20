import { createTool, createToolkit, type Toolkit } from "@voltagent/core"
import type { AxiosResponse } from "axios";
import axios from "axios"
import NodeCache from "node-cache"
import { z } from "zod"
import { inspect } from "util"
import fastSafeStringify from "fast-safe-stringify"
import serializeJS from "serialize-javascript"
import { voltlogger } from "../config/logger.js"

// Small helper to format unknown errors reliably
function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}


// Initialize cache
const apiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 })

// Safely serialize unknown values to avoid returning `any`.
// Returns primitive/arrays/objects as-is; converts functions/symbols/bigint/others to string.
//


// Async serializer that will attempt to use an installed package if available.
// Falls back to a robust local implementation otherwise.
// Synchronous serializer used by callers. This keeps the implementation sync
// (no hidden Promises) while providing an async wrapper for compatibility.
export function safeSerialize(value: unknown): string {
  // Preferred: try the statically imported fast-safe-stringify but cast to unknown
  try {
    const maybe = fastSafeStringify as unknown
    if (typeof maybe === 'function') {
      return (maybe as (v: unknown) => string)(value)
    }
  } catch {
    // fall through
  }

  // Use serialize-javascript (already imported) as the secondary option
  try {
    const maybeSerialize = serializeJS as unknown
    if (typeof maybeSerialize === 'function') {
      return (maybeSerialize as (v: unknown, opts?: { unsafe?: boolean }) => string)(value, { unsafe: true })
    }
  } catch {
    // fall through to local serializer
  }

  // Fallback local serializer
  try {
    const seen = new WeakSet<object>()
    const json = JSON.stringify(value, (_key: string, v: unknown): unknown => {
      if (typeof v === 'bigint') { return (v).toString() }
      if (typeof v === 'symbol') { return String(v) }
      if (typeof v === 'function') { return String(v) }
      if (typeof v === 'object' && v !== null) {
        const obj = v
        if (seen.has(obj)) { return '[Circular]' }
        seen.add(obj)
      }
      return v
    })

    return json ?? (inspect(value, { depth: null }))
  } catch {
    try {
      return Object.prototype.toString.call(value)
    } catch {
      return inspect(value, { depth: null })
    }
  }
}

// Async wrapper kept for backward compatibility
export function safeSerializeAsync(value: unknown): Promise<string> {
  return Promise.resolve(safeSerialize(value))
}

export const fetchApiTool = createTool({
  name: "fetch_api",
  description: "Fetch data from API endpoints with authentication",
  parameters: z.object({
    url: z.string(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.any().optional(),
    timeout: z.number().default(30000),
  }),
  execute: async (args, context) => {
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info(`API fetch: ${args.method} ${args.url}`, { operationId: context?.operationId })

    try {
      // Sanitize the request body to avoid unsafe `any` assignment
      const { body: rawBody } = args as { body?: unknown }
      let data: unknown

      if (rawBody !== undefined) {
        if (
          typeof rawBody === "string" ||
          typeof rawBody === "number" ||
          typeof rawBody === "boolean" ||
          Array.isArray(rawBody) ||
          (typeof rawBody === "object" && rawBody !== null)
        ) {
          data = rawBody
        } else {
          // Use a safer serialization for non-plain values (functions, symbols, bigint, etc.)
          const safeToString = (val: unknown): string => {
            try {
              if (typeof val === "symbol") {return val.toString()}
              if (typeof val === "function") {return val.toString()}
              if (val === undefined) {return "undefined"}

              // Handle BigInt which JSON.stringify doesn't support
              const replacer = (_key: string, v: unknown) => (typeof v === "bigint" ? String(v) : v)

              const json = JSON.stringify(val, replacer)
              if (typeof json === "string") {return json}

              return inspect(val, { depth: null })
            } catch {
              // Fall back to safer Object.prototype.toString in edge cases (e.g., circular refs)
              try {
                return Object.prototype.toString.call(val)
              } catch {
                return inspect(val, { depth: null })
              }
            }
          }

          data = safeToString(rawBody)
        }
      }

      const axiosResponse: AxiosResponse<unknown> = await axios.request<unknown>({
        method: args.method,
        url: args.url,
        headers: args.headers,
        data,
        timeout: args.timeout,
        signal: AbortSignal.timeout(args.timeout),
      })
      const { data: responseRaw, status } = axiosResponse

      // Treat axios responseRaw as unknown and sanitize it before returning to avoid unsafe `any` assignment
      let responseData: unknown

      if (
        responseRaw === null ||
        typeof responseRaw === "string" ||
        typeof responseRaw === "number" ||
        typeof responseRaw === "boolean" ||
        Array.isArray(responseRaw) ||
        (typeof responseRaw === "object" && responseRaw !== null)
      ) {
        responseData = responseRaw
      } else {
        // Avoid default object stringification ("[object Object]") by providing a safer string representation.
        // Handle symbols and functions explicitly; attempt JSON.stringify with support for BigInt and circular refs,
        // fall back to util.inspect and finally Object.prototype.toString.
        try {
          if (typeof responseRaw === "symbol") {
            responseData = String(responseRaw)
          } else if (typeof responseRaw === "function") {
            responseData = String(responseRaw)
          } else {
            // Try JSON.stringify with safe handling for BigInt and circular references.
            try {
              const seen = new WeakSet<object>()
              const json = JSON.stringify(responseRaw as object, (_key: string, value: unknown): unknown => {
                if (typeof value === "bigint") {return String(value)}
                if (typeof value === "object" && value !== null) {
                  const obj = value
                  if (seen.has(obj)) {return "[Circular]"}
                  seen.add(obj)
                }
                return value
              })
              responseData = json ?? inspect(responseRaw, { depth: null })
            } catch {
              // As a robust fallback, use util.inspect to get a readable representation.
              responseData = inspect(responseRaw, { depth: null })
            }
          }
        } catch {
          responseData = Object.prototype.toString.call(responseRaw)
        }
      }

      return { success: true, status, data: responseData, timestamp: new Date().toISOString() }
    } catch (error: unknown) {
      return { success: false, error: formatError(error), timestamp: new Date().toISOString() }
    }
  },
})

export const aggregateApisTool = createTool({
  name: "aggregate_apis",
  description: "Aggregate data from multiple APIs",
  parameters: z.object({ endpoints: z.array(z.object({ url: z.string(), name: z.string() })), mergeStrategy: z.enum(["concat", "merge", "dedupe"]).default("concat") }),
  execute: async (args, context) => {
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info(`Aggregating ${args.endpoints.length} APIs`, { operationId: context?.operationId })

    try {
      const results: Array<{ name: string; data?: unknown; success: boolean; error?: string }> = []

      for (const endpoint of args.endpoints) {
        try {
          const response: AxiosResponse<unknown> = await axios.get<unknown>(endpoint.url)
          results.push({ name: endpoint.name, data: response.data, success: true })
        } catch (error: unknown) {
          results.push({ name: endpoint.name, error: formatError(error), success: false })
        }
      }

      return { results, mergeStrategy: args.mergeStrategy, timestamp: new Date().toISOString() }
    } catch (error: unknown) {
      return { results: [], error: formatError(error), mergeStrategy: args.mergeStrategy, timestamp: new Date().toISOString() }
    }
  },
})

export const handlePaginationTool = createTool({
  name: "handle_pagination",
  description: "Handle paginated API responses",
  parameters: z.object({ baseUrl: z.string(), paginationType: z.enum(["offset", "cursor", "page"]).default("page"), maxPages: z.number().default(10), pageSize: z.number().default(100) }),
  execute: async (args, context) => {
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info(`Handling pagination: ${args.paginationType}`, { operationId: context?.operationId })

    try {
      const allResults: unknown[] = []
      let totalPages = 0

      for (let page = 1; page <= args.maxPages; page++) {
        let url = args.baseUrl

        if (args.paginationType === "page") {
          url += `?page=${page}&limit=${args.pageSize}`
        } else if (args.paginationType === "offset") {
          const offset = (page - 1) * args.pageSize
          url += `?offset=${offset}&limit=${args.pageSize}`
        } else {
          url += `?cursor=${page === 1 ? "initial" : `page_${page}`}&limit=${args.pageSize}`
        }

        const response: AxiosResponse<unknown> = await axios.get<unknown>(url)
        const { status, data } = response
        if (status >= 200 && status < 300) {
          const resultsToAdd = Array.isArray(data) ? (data as unknown[]) : ((data as Record<string, unknown>)?.results ?? [])
          allResults.push(...(resultsToAdd as unknown[]))

          if (Array.isArray(data) && data.length < args.pageSize) {
            totalPages = page
            break
          }
        }
      }

      return { allResults, totalPages, totalItems: allResults.length, timestamp: new Date().toISOString() }
    } catch (error: unknown) {
      return { allResults: [], totalPages: 0, totalItems: 0, error: formatError(error), timestamp: new Date().toISOString() }
    }
  }
})

export const cacheApiResponseTool = createTool({
  name: "cache_api_response",
  description: "Cache API responses with TTL",
  parameters: z.object({ key: z.string(), data: z.unknown().optional(), ttlSeconds: z.number().default(3600), action: z.enum(["get", "set", "invalidate"]).default("get") }),
  execute: (args, context) => {
    if (context?.isActive === false) { throw new Error("Operation cancelled") }
    voltlogger.info(`Cache ${args.action}: ${args.key}`, { operationId: context?.operationId })

    try {
      switch (args.action) {
        case "get": {
          const cached = apiCache.get<unknown>(args.key)
          return { success: true, action: "get", cached: cached !== undefined, data: cached, timestamp: new Date().toISOString() }
        }

        case "set": {
          if (args.data !== undefined) {
            apiCache.set(args.key, args.data, args.ttlSeconds)
            return { success: true, action: "set", cached: true, timestamp: new Date().toISOString() }
          }
          return { success: false, action: "set", cached: false, error: "No data provided", timestamp: new Date().toISOString() }
        }

        case "invalidate": {
          const deleted = apiCache.del(args.key)
          return { success: true, action: "invalidate", cached: false, deleted, timestamp: new Date().toISOString() }
        }

        default:
          return { success: false, action: args.action, cached: false, error: "Invalid action", timestamp: new Date().toISOString() }
      }
    } catch (error: unknown) {
      return { success: false, action: args.action, cached: false, error: formatError(error), timestamp: new Date().toISOString() }
    }
  },
})

export const retryWithBackoffTool = createTool({
  name: "retry_with_backoff",
  description: "Retry API calls with exponential backoff",
  parameters: z.object({ url: z.string(), maxRetries: z.number().default(3), initialDelayMs: z.number().default(1000), maxDelayMs: z.number().default(30000) }),
  execute: async (args, context) => {
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info(`Retry with backoff: ${args.url}`, { operationId: context?.operationId })

    let lastError: Error | null = null
    let attempts = 0

    for (let attempt = 0; attempt <= args.maxRetries; attempt++) {
      attempts = attempt + 1

      try {
        const delay = Math.min(args.initialDelayMs * Math.pow(2, attempt), args.maxDelayMs)
        if (attempt > 0) {
          voltlogger.info(`Retry attempt ${attempts} after ${delay}ms delay`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response: AxiosResponse<unknown> = await axios.get<unknown>(args.url)
        return { success: true, data: response.data, attempts, lastError: null, timestamp: new Date().toISOString() }

      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(formatError(error))
      }

      if (context && context.isActive !== true) {
        throw new Error("Operation cancelled")
      }
    }

    return { success: false, attempts, lastError, timestamp: new Date().toISOString() }
  },
})

export const normalizeApiResponseTool = createTool({
  name: "normalize_api_response",
  description: "Normalize responses from different APIs",
  parameters: z.object({ response: z.unknown(), schema: z.record(z.string(), z.string()).describe("Field mapping") }),
  execute: (args, context) => {
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info("Normalizing API response", { operationId: context?.operationId })

    try {
      const normalized: Record<string, unknown> = {}
      const originalFields: string[] = []
      const mappedFields: string[] = []

      const resp = args.response
      if (typeof resp === "object" && resp !== null) {
        const respObj = resp as Record<string, unknown>
        for (const [targetField, sourceField] of Object.entries(args.schema)) {
          originalFields.push(sourceField)
          if (Object.prototype.hasOwnProperty.call(respObj, sourceField)) {
            normalized[targetField] = respObj[sourceField]
            mappedFields.push(targetField)
          }
        }
      }

      return { normalized, originalFields, mappedFields, timestamp: new Date().toISOString() }
    } catch (error: unknown) {
      return { normalized: {}, originalFields: [], mappedFields: [], error: formatError(error), timestamp: new Date().toISOString() }
    }
  },
})

export const apiIntegrationToolkit: Toolkit = createToolkit({
  name: "api_integration_toolkit",
  description: "API integration and data fetching tools",
  instructions: "Use these tools for API calls, pagination, caching, and response normalization.",
  addInstructions: true,
  tools: [fetchApiTool, aggregateApisTool, handlePaginationTool, cacheApiResponseTool, retryWithBackoffTool, normalizeApiResponseTool],
})
