
import { Agent } from "@voltagent/core";

import * as crypto from "node:crypto";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { codeAnalysisToolkit } from "../tools/code-analysis-toolkit.js";
import { filesystemToolkit } from "../tools/filesystem-toolkit.js";
import { gitToolkit } from "../tools/git-toolkit.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { testToolkit } from "../tools/test-toolkit.js";
import { defaultAgentHooks } from "./agentHooks.js";
import { codeReviewerPrompt } from "./prompts.js";

export const codeReviewerAgent = new Agent({
  id: "code-reviewer",
  name: "Code Reviewer",
  purpose: "Review code for quality, bugs, and security issues",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: codeReviewerPrompt({
    task: "Review the provided code changes",
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
      voltlogger.info(`[${opId}] Code Reviewer starting`);
      await Promise.resolve();
    },
    onToolStart: async ({ tool, context }) => {
      const opId = String(context.context.get('opId'));
      voltlogger.info(`[${opId}] tool: ${String(tool.name)}`);
      await Promise.resolve();
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errMsg = error instanceof Error ? `${error.message}${error.stack ? `\n${error.stack}` : ""}` : String(error);
        voltlogger.error(`[${opId}] tool ${String(tool.name)} failed: ${errMsg}`);
      }
      await Promise.resolve();
      return;
    },
    onEnd: async ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        voltlogger.error(`[${opId}] Code Reviewer error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Code Reviewer completed`);
      }
      await Promise.resolve();
    },
  },
  temperature: 0.1, // Very low temperature for consistent reviews
  maxOutputTokens: 64000,
  maxSteps: 20,
  observability: voltObservability,
  logger: voltlogger,
  eval: {
    scorers: {},
  },
  inputGuardrails: [],
  outputGuardrails: [],
});
