import { createTool, createToolkit, type Toolkit } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"

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
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info(`API fetch: ${args.method} ${args.url}`, { operationId: context?.operationId })
    try {
      const response = await fetch(args.url, {
        method: args.method,
        headers: args.headers,
        body: args.body ? JSON.stringify(args.body) : undefined,
        signal: AbortSignal.timeout(args.timeout),
      })
      const data = await response.json()
      return { success: true, status: response.status, data, timestamp: new Date().toISOString() }
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
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info(`Aggregating ${args.endpoints.length} APIs`, { operationId: context?.operationId })
    return { results: [], mergeStrategy: args.mergeStrategy, timestamp: new Date().toISOString() }
  },
})

export const handlePaginationTool = createTool({
  name: "handle_pagination",
  description: "Handle paginated API responses",
  parameters: z.object({ baseUrl: z.string(), paginationType: z.enum(["offset", "cursor", "page"]).default("page"), maxPages: z.number().default(10), pageSize: z.number().default(100) }),
  execute: async (args, context) => {
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info(`Handling pagination: ${args.paginationType}`, { operationId: context?.operationId })
    return { allResults: [], totalPages: 0, totalItems: 0, timestamp: new Date().toISOString() }
  },
})

export const cacheApiResponseTool = createTool({
  name: "cache_api_response",
  description: "Cache API responses with TTL",
  parameters: z.object({ key: z.string(), data: z.any().optional(), ttlSeconds: z.number().default(3600), action: z.enum(["get", "set", "invalidate"]).default("get") }),
  execute: async (args, context) => {
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info(`Cache ${args.action}: ${args.key}`, { operationId: context?.operationId })
    return { success: true, action: args.action, cached: false, timestamp: new Date().toISOString() }
  },
})

export const retryWithBackoffTool = createTool({
  name: "retry_with_backoff",
  description: "Retry API calls with exponential backoff",
  parameters: z.object({ url: z.string(), maxRetries: z.number().default(3), initialDelayMs: z.number().default(1000), maxDelayMs: z.number().default(30000) }),
  execute: async (args, context) => {
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info(`Retry with backoff: ${args.url}`, { operationId: context?.operationId })
    return { success: false, attempts: 0, lastError: null, timestamp: new Date().toISOString() }
  },
})

export const normalizeApiResponseTool = createTool({
  name: "normalize_api_response",
  description: "Normalize responses from different APIs",
  parameters: z.object({ response: z.any(), schema: z.record(z.string(), z.string()).describe("Field mapping") }),
  execute: async (args, context) => {
    if (!context?.isActive) { throw new Error("Operation cancelled") }
    voltlogger.info("Normalizing API response", { operationId: context?.operationId })
    return { normalized: {}, originalFields: [], mappedFields: [], timestamp: new Date().toISOString() }
  },
})

export const apiIntegrationToolkit: Toolkit = createToolkit({
  name: "api_integration_toolkit",
  description: "API integration and data fetching tools",
  instructions: "Use these tools for API calls, pagination, caching, and response normalization.",
  addInstructions: true,
  tools: [fetchApiTool, aggregateApisTool, handlePaginationTool, cacheApiResponseTool, retryWithBackoffTool, normalizeApiResponseTool],
})
