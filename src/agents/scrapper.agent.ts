import { Agent, Memory, AiSdkEmbeddingAdapter } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { voltlogger } from "../config/logger.js";
import { webScraperToolkit } from "../tools/web-scraper-toolkit.js";
import z from "zod";
import { scrapperPrompt } from "./prompts.js";

// Local SQLite for scrapper
const scrapperMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/scrapper-memory.db",
  }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z
        .object({
          name: z.string().optional(),
          role: z.string().optional(),
          timezone: z.string().optional(),
        })
        .optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
});

export const scrapperAgent = new Agent({
  id: "scrapper",
  name: "Scrapper",
  purpose: "Extract and collect data from web sources for research and analysis",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: scrapperPrompt({
    sources: "web pages, APIs, structured data",
    format: "markdown, structured data, clean text",
    ethics: "respect robots.txt, rate limiting, terms of service",
    errorHandling: "graceful failures, retry logic, timeout handling",
    tools: "web scraper toolkit with multiple extraction methods",
    standards: "Data quality over quantity, ethical practices, structured output",
    task: "Extract and collect data from web sources",
  }),
  tools: [],
  toolkits: [webScraperToolkit],
  memory: scrapperMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  temperature: 0.3,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: false,
  logger: voltlogger,
});
