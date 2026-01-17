import { createTool, createToolkit, type Toolkit } from "@voltagent/core"
import axios from "axios"
import NodeCache from "node-cache"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"

// Initialize cache
const apiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 })

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
    if (context?.isActive === false) { throw new Error("Operation cancelled") }
    voltlogger.info(`API fetch: ${args.method} ${args.url}`, { operationId: context?.operationId })

    try {
      const response = await axios({
        method: args.method,
        url: args.url,
        headers: args.headers,
        data: args.body,
        timeout: args.timeout,
        signal: AbortSignal.timeout(args.timeout),
      })

      return { success: true, status: response.status, data: response.data, timestamp: new Date().toISOString() }
    } catch (error) {
      return { success: false, error: String(error), timestamp: new Date().toISOString() }
    }
  },
})

export const aggregateApisTool = createTool({
  name: "aggregate_apis",
  description: "Aggregate data from multiple APIs",
  parameters: z.object({ endpoints: z.array(z.object({ url: z.string(), name: z.string() })), mergeStrategy: z.enum(["concat", "merge", "dedupe"]).default("concat") }),
  execute: async (args, context) => {
    if (context?.isActive === false) { throw new Error("Operation cancelled") }
    voltlogger.info(`Aggregating ${args.endpoints.length} APIs`, { operationId: context?.operationId })

    try {
      const results = []

      for (const endpoint of args.endpoints) {
        try {
          const response = await axios.get(endpoint.url)
          results.push({ name: endpoint.name, data: response.data, success: true })
        } catch (error) {
          results.push({ name: endpoint.name, error: String(error), success: false })
        }
      }

      return { results, mergeStrategy: args.mergeStrategy, timestamp: new Date().toISOString() }
    } catch (error) {
      return { results: [], error: String(error), mergeStrategy: args.mergeStrategy, timestamp: new Date().toISOString() }
    }
  },
})

export const handlePaginationTool = createTool({
  name: "handle_pagination",
  description: "Handle paginated API responses",
  parameters: z.object({ baseUrl: z.string(), paginationType: z.enum(["offset", "cursor", "page"]).default("page"), maxPages: z.number().default(10), pageSize: z.number().default(100) }),
  execute: async (args, context) => {
    if (context?.isActive === false) { throw new Error("Operation cancelled") }
    voltlogger.info(`Handling pagination: ${args.paginationType}`, { operationId: context?.operationId })

    try {
      const allResults = []
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

        const response = await axios.get(url)
        if (response.status >= 200 && response.status < 300) {
          const data = response.data as unknown
          const resultsToAdd = Array.isArray(data) ? data : ((data as Record<string, unknown>).results || [])
          allResults.push(...(resultsToAdd as unknown[]))

          if (Array.isArray(data) && data.length < args.pageSize) {
            totalPages = page
            break
          }
        }
      }

      return { allResults, totalPages, totalItems: allResults.length, timestamp: new Date().toISOString() }
    } catch (error) {
      return { allResults: [], totalPages: 0, totalItems: 0, error: String(error), timestamp: new Date().toISOString() }
    }
  }
})

export const cacheApiResponseTool = createTool({
  name: "cache_api_response",
  description: "Cache API responses with TTL",
  parameters: z.object({ key: z.string(), data: z.any().optional(), ttlSeconds: z.number().default(3600), action: z.enum(["get", "set", "invalidate"]).default("get") }),
  execute: (args, context) => {
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info(`Cache ${args.action}: ${args.key}`, { operationId: context?.operationId })

    try {
      switch (args.action) {
        case "get": {
          const cached = apiCache.get(args.key)
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
    } catch (error) {
      return { success: false, action: args.action, cached: false, error: String(error), timestamp: new Date().toISOString() }
    }
  },
})

export const retryWithBackoffTool = createTool({
  name: "retry_with_backoff",
  description: "Retry API calls with exponential backoff",
  parameters: z.object({ url: z.string(), maxRetries: z.number().default(3), initialDelayMs: z.number().default(1000), maxDelayMs: z.number().default(30000) }),
  execute: async (args, context) => {
    if (!context?.isActive) { throw new Error("Operation cancelled") }
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

        const response = await axios.get(args.url)
        return { success: true, data: response.data, attempts, lastError: null, timestamp: new Date().toISOString() }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
      }

      if (!context?.isActive) {
        throw new Error("Operation cancelled")
      }
    }

    return { success: false, attempts, lastError, timestamp: new Date().toISOString() }
  },
})

export const normalizeApiResponseTool = createTool({
  name: "normalize_api_response",
  description: "Normalize responses from different APIs",
  parameters: z.object({ response: z.any(), schema: z.record(z.string(), z.string()).describe("Field mapping") }),
  execute: (args, context) => {
    if (context?.isActive === false) { throw new Error("Operation cancelled") }
    voltlogger.info("Normalizing API response", { operationId: context?.operationId })

    try {
      const normalized: Record<string, unknown> = {}
      const originalFields: string[] = []
      const mappedFields: string[] = []

      for (const [targetField, sourceField] of Object.entries(args.schema)) {
        originalFields.push(sourceField)

        if (sourceField in args.response) {
          normalized[targetField] = args.response[sourceField]
          mappedFields.push(targetField)
        }
      }

      return { normalized, originalFields, mappedFields, timestamp: new Date().toISOString() }
    } catch (error) {
      return { normalized: {}, originalFields: [], mappedFields: [], error: String(error), timestamp: new Date().toISOString() }
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
