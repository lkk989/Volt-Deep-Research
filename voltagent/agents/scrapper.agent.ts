import { Agent } from "@voltagent/core";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { webScraperToolkit } from "../tools/web-scraper-toolkit.js";
import { scrapperPrompt } from "./prompts.js";

export const scrapperAgent = new Agent({
  id: "scrapper",
  name: "Scrapper",
  purpose: "Extract and collect data from web sources for research and analysis",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
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
  toolRouting: {
    embedding: {
      model: "google/text-embedding-004",
      topK: 3,
      toolText: (tool) => {
        const tags = tool.tags?.join(", ") ?? "";
        return [tool.name, tool.description, tags].filter(Boolean).join("\n");
      },
    },
  },
  memory: sharedMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Scrapper starting`);
      await Promise.resolve();
    },
    onToolStart: async ({ tool, context }) => {
      const opId = context.context.get('opId') as string;
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
      await Promise.resolve();
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
      await Promise.resolve();
    },
    onEnd: async ({ output, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] Scrapper error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Scrapper completed`);
      }
      await Promise.resolve();
    },
    onPrepareMessages: async ({ messages, context }) => {
      const opId = context?.context.get('opId') as string | undefined;
      voltlogger.debug(`[${opId ?? 'unknown-op'}] preparing messages`, {
        count: messages.length,
      });
      await Promise.resolve();
      return { messages };
    },
  },
  temperature: 0.3,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: false,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
});
