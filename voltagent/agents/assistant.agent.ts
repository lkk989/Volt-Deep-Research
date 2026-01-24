import { google } from "@ai-sdk/google";
import { Agent, AiSdkEmbeddingAdapter, Memory, createTool } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import z from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { getForecastOpenMeteo, getWeatherTool } from "../tools/weather-toolkit.js";
import { defaultAgentHooks } from "./agentHooks.js";
import { assistantPrompt } from "./prompts.js";
export const assistantAgent = new Agent({
  id: "assistant",
  name: "Assistant",
  purpose: "Generate effective search queries and coordinate research tasks",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: assistantPrompt({
    topic: "general research",
    strategy: "comprehensive",
    sources: "web, academic, news",
    expertise: "intermediate",
    task: "Generate search queries for the research topic",
  }),
  tools: [getWeatherTool, getForecastOpenMeteo],
  toolkits: [thinkOnlyToolkit],
  memory: sharedMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Assistant starting`);
      return undefined;
    },
    onToolStart: ({ tool, context }) => {
      const opId = String(context.context.get('opId'));
      voltlogger.info(`[${opId}] tool: ${String(tool.name)} starting`);
      return undefined;
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errMsg = error instanceof Error ? (error.stack || error.message) : String(error);
        voltlogger.error(`[${opId}] tool ${String(tool.name)} failed: ${errMsg}`);
      } else {
        voltlogger.info(`[${opId}] tool ${String(tool.name)} completed`);
      }
      return undefined;
    },
    onPrepareMessages: ({ messages }) => {
      return { messages };
    },
    onEnd: ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] Assistant error: ${errorMessage}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Assistant completed`);
      } else {
        voltlogger.info(`[${opId}] Assistant ended without output`);
      }
      return undefined;
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
  context: {
    provider: 'google',
    model: 'gemini-2.5-flash-lite-preview-09-2025',
  },
  eval: {
    scorers: {},
  },
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
});
