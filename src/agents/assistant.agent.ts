import { Agent, Memory,  createTool, AiSdkEmbeddingAdapter } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { voltlogger } from "../config/logger.js";
import { assistantPrompt } from "./prompts.js";
import z from "zod";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";

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
  description: "Get current weather for any city",
  parameters: z.object({
    location: z.string().describe("City and state, e.g. New York, NY"),
  }),
  execute: async ({ location }) => {
    voltlogger.info("Getting weather for " + location + "...");
    if (location.toLowerCase().includes("new york")) {
      return { temperature: "18°C", condition: "Partly cloudy" };
    }
    return { temperature: "24°C", condition: "Sunny" };
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
  hooks: {},
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
  observability: undefined,
});

