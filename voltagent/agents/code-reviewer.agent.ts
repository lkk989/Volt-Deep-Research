import { Agent, Memory } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { AiSdkEmbeddingAdapter } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";
import { codeReviewerPrompt } from "./prompts.js";
import { codeAnalysisToolkit } from "../tools/code-analysis-toolkit.js";
import { filesystemToolkit } from "../tools/filesystem-toolkit.js";
import { gitToolkit } from "../tools/git-toolkit.js";
import { testToolkit } from "../tools/test-toolkit.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { voltObservability } from "../config/observability.js";
import z from "zod";
import * as crypto from "node:crypto";
import { sharedMemory } from "../config/libsql.js";

// Agent Memory Setup
const reviewerMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/reviewer-memory.db",
    logger: voltlogger,
  }),
  workingMemory: {
    enabled: true,
    schema: z.object({
      filesReviewed: z.array(z.string()).optional(),
      issuesFound: z.array(z.object({
        file: z.string(),
        issue: z.string(),
        severity: z.enum(["critical", "warning", "info"])
      })).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.embedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db", logger: voltlogger }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
});

export const codeReviewerAgent = new Agent({
  id: "code-reviewer",
  name: "Code Reviewer",
  purpose: "Review code for quality, bugs, and security issues",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: codeReviewerPrompt({
    task: "Review the provided code changes",
  }),
  tools: [],
  toolkits: [codeAnalysisToolkit, filesystemToolkit, gitToolkit, testToolkit, thinkOnlyToolkit],
  memory: sharedMemory,
  hooks: {
    onStart: ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Code Reviewer starting`);
    },
    onToolStart: ({ tool, context }) => {
      const opId = String(context.context.get('opId'));
      voltlogger.info(`[${opId}] tool: ${String(tool.name)}`);
    },
    onToolEnd: ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
    onEnd: ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        voltlogger.error(`[${opId}] Code Reviewer error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Code Reviewer completed`);
      }
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
