import { google } from "@ai-sdk/google";
import { Agent } from "@voltagent/core";

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
import { defaultAgentHooks } from "./agentHooks.js";
import { codingAgentPrompt } from "./prompts.js";

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
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Coding Agent starting`);
      await Promise.resolve();
    },
    onEnd: async ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] Coding Agent error: ${msg}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Coding Agent completed`);
      }
      await Promise.resolve();
    },
    onToolStart: async ({ tool, context }) => {
      const opId = String(context.context.get('opId'));
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
      await Promise.resolve();
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] tool ${tool.name} failed: ${msg}`);
      } else {
        voltlogger.info(`[${opId}] tool ${tool.name} completed`);
      }
      await Promise.resolve();
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
