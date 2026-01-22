import { google } from "@ai-sdk/google";
import { Agent, AiSdkEmbeddingAdapter, Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import * as crypto from "node:crypto";
import z from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { codeAnalysisToolkit } from "../tools/code-analysis-toolkit.js";
import { filesystemToolkit } from "../tools/filesystem-toolkit.js";
import { gitToolkit } from "../tools/git-toolkit.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { testToolkit } from "../tools/test-toolkit.js";
import { codingAgentPrompt } from "./prompts.js";

// Agent Memory Setup
const codingMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/coding-memory.db",
    logger: voltlogger,
  }),
  workingMemory: {
    enabled: true,
    schema: z.object({
      currentTask: z.string().optional(),
      filesModified: z.array(z.string()).optional(),
      implementationPlan: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.embedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db", logger: voltlogger }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
});

export const codingAgent = new Agent({
  id: "coding-agent",
  name: "Coding Agent",
  purpose: "Implement code features, fix bugs, and refactor code",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: codingAgentPrompt({
    language: "TypeScript",
    framework: "VoltAgent",
    taskType: "implementation",
    constraints: "Follow project patterns",
    task: "Implement the requested feature",
  }),
  tools: [],
  toolkits: [codeAnalysisToolkit, filesystemToolkit, gitToolkit, testToolkit, thinkOnlyToolkit],
  memory: sharedMemory,
  hooks: {
    onStart: ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Coding Agent starting`);
    },
    onEnd: ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        voltlogger.error(`[${opId}] Coding Agent error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Coding Agent completed`);
      }
    },
    onToolStart: ({ tool, context }) => {
      const opId = String(context.context.get('opId'))
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
    },
    onToolEnd: ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
  },
  temperature: 0.2, // Lower temperature for coding precision
  maxOutputTokens: 64000,
  maxSteps: 30,
  observability: voltObservability,
  logger: voltlogger,
  inputGuardrails: [],
  outputGuardrails: [],
});
