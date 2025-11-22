import { Agent, Memory,  createTool, AiSdkEmbeddingAdapter } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { voltlogger } from "../config/logger.js";
import { assistantPrompt } from "./prompts.js";
import z from "zod";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { voltObservability } from "../config/observability.js";

// Local SQLite
const assistantMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/assistant-memory.db",
  }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        timezone: z.string().optional(),
      }).optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }), // or InMemoryVectorAdapter() for dev
  enableCache: true, // optional embedding cache
  cacheSize: 1000, // optional cache size
  cacheTTL: 3600000, // optional cache TTL in seconds
});

//const AImemory = new Memory({
//  storage: new InMemoryStorageAdapter(),
//});

const getWeatherTool = createTool({
  name: "get_weather",
  description:
    "Get normalized daily OHLCV data for a symbol using Alpha Vantage TIME_SERIES_DAILY. Use only when financial time series is required.",
  parameters: z.object({
    symbol: z.string().min(1).describe("Asset symbol, e.g. 'AAPL', 'MSFT', 'SPY'").trim(),
    outputSize: z
      .enum(["compact", "full"])
      .optional()
      .default("compact")
      .describe("'compact' (last ~100 points) or 'full' (full history)"),
  }),
  execute: async ({ symbol, outputSize }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      throw new Error("Missing ALPHA_VANTAGE_API_KEY environment variable")
    }

    try {
      const url = new URL("https://www.alphavantage.co/query")
      url.searchParams.set("function", "TIME_SERIES_DAILY")
      url.searchParams.set("symbol", symbol)
      url.searchParams.set("outputsize", outputSize ?? "compact")
      url.searchParams.set("datatype", "json")
      url.searchParams.set("apikey", apiKey)

      voltlogger.info(`Alpha Vantage (assistant/get_weather): TIME_SERIES_DAILY for ${symbol}`, {
        operationId: context.operationId,
      })

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Alpha Vantage HTTP ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as {
        "Time Series (Daily)"?: Record<
          string,
          {
            "1. open": string
            "2. high": string
            "3. low": string
            "4. close": string
            "5. volume": string
          }
        >
        Note?: string
        "Error Message"?: string
      }

      if (data["Error Message"]) {
        throw new Error(`Alpha Vantage error: ${data["Error Message"]}`)
      }

      const series = data["Time Series (Daily)"]
      if (!series) {
        throw new Error(data.Note || "Missing 'Time Series (Daily)' in response")
      }

      const points = Object.entries(series).map(([date, v]) => ({
        date,
        open: Number(v["1. open"]),
        high: Number(v["2. high"]),
        low: Number(v["3. low"]),
        close: Number(v["4. close"]),
        volume: Number(v["5. volume"]),
      }))

      return {
        symbol,
        outputSize: outputSize ?? "compact",
        pointCount: points.length,
        points,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      voltlogger.error(`assistant/get_weather failed: ${message}`)
      throw new Error(`Failed to fetch Alpha Vantage data: ${message}`)
    }
  },
});

export const assistantAgent = new Agent({
  id: "assistant",
  name: "Assistant",
  purpose: "Generate effective search queries and coordinate research tasks",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: assistantPrompt({
    topic: "general research",
    strategy: "comprehensive",
    sources: "web, academic, news",
    expertise: "intermediate",
    task: "Generate search queries for the research topic",
  }),
  tools: [getWeatherTool],
  toolkits: [thinkOnlyToolkit],
  memory: assistantMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Assistant starting`);
    },
    onEnd: async ({ output, error, context }) => {
      const opId = context.context.get('opId');
      if (error) {
        voltlogger.error(`[${opId}] Assistant error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Assistant completed`);
      }
    },
    onToolStart: async ({ tool, context }) => {
      const opId = context.context.get('opId');
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = context.context.get('opId');
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
    onPrepareMessages: async ({ messages }) => {
      return { messages };
    },
  },
  inputGuardrails: [],
  outputGuardrails: [],
  temperature: 0.7,
  maxOutputTokens: 64000,
  maxSteps: 25,
  stopWhen: undefined,
  markdown: false,
  voice: undefined,
  context: undefined,
  eval: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
});

