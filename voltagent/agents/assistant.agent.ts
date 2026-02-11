import { Agent } from "@voltagent/core";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { getForecastOpenMeteo, getWeatherTool } from "../tools/weather-toolkit.js";
//import { defaultAgentHooks } from "./agentHooks.js";
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
      voltlogger.info(`[${opId}] Assistant starting`);
      await Promise.resolve();
      return undefined;
    },
    onToolStart: async ({ tool, context }) => {
      const opId = String(context.context.get('opId'));
      voltlogger.info(`[${opId}] tool: ${String(tool.name)} starting`);
      await Promise.resolve();
      return undefined;
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errMsg = error instanceof Error ? (error.stack ?? error.message) : String(error);
        voltlogger.error(`[${opId}] tool ${String(tool.name)} failed: ${errMsg}`);
      } else {
        voltlogger.info(`[${opId}] tool ${String(tool.name)} completed`);
      }
      await Promise.resolve();
      return undefined;
    },
    onPrepareMessages: async ({ messages, context }) => {
      const opId = context?.context.get('opId');
      const opIdValue =
        typeof opId === 'string' && opId.length > 0 ? opId : 'unknown-op';
      voltlogger.debug(`[${opIdValue}] preparing messages`, {
        count: messages.length,
      });
      await Promise.resolve();
      return { messages };
    },
    onEnd: async ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] Assistant error: ${errorMessage}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Assistant completed`);
      } else {
        voltlogger.info(`[${opId}] Assistant ended without output`);
      }
      await Promise.resolve();
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
