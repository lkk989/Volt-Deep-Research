import { Agent, Memory } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { AiSdkEmbeddingAdapter } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";
import { codingAgentPrompt } from "./prompts.js";
import { codeAnalysisToolkit } from "../tools/code-analysis-toolkit.js";
import { filesystemToolkit } from "../tools/filesystem-toolkit.js";
import { gitToolkit } from "../tools/git-toolkit.js";
import { testToolkit } from "../tools/test-toolkit.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { voltObservability } from "../config/observability.js";
import z from "zod";
import * as crypto from "node:crypto";

// Agent Memory Setup
const codingMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/coding-memory.db",
  }),
  workingMemory: {
    enabled: true,
    schema: z.object({
      currentTask: z.string().optional(),
      filesModified: z.array(z.string()).optional(),
      implementationPlan: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
});

export const codingAgent = new Agent({
  id: "coding-agent",
  name: "Coding Agent",
  purpose: "Implement code features, fix bugs, and refactor code",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: codingAgentPrompt({
    language: "TypeScript",
    framework: "VoltAgent",
    taskType: "implementation",
    constraints: "Follow project patterns",
    task: "Implement the requested feature",
  }),
  tools: [],
  toolkits: [codeAnalysisToolkit, filesystemToolkit, gitToolkit, testToolkit, thinkOnlyToolkit],
  memory: codingMemory,
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Coding Agent starting`);
    },
    onEnd: async ({ output, error, context }) => {
      const opId = context.context.get('opId');
      if (error) {
        voltlogger.error(`[${opId}] Coding Agent error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Coding Agent completed`);
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
  },
  temperature: 0.2, // Lower temperature for coding precision
  maxOutputTokens: 64000,
  maxSteps: 30,
  observability: voltObservability,
  logger: voltlogger,
});
