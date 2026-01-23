import { google } from "@ai-sdk/google";
import { Agent, AiSdkEmbeddingAdapter, createTool, Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import z from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js"
import { defaultAgentHooks } from "./agentHooks.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { factCheckerPrompt } from "./prompts.js";
import { crossReferenceSourcesTool, detectBiasTool, verifyClaimTool } from "../tools/analyze-data-tool.js";

export const factCheckerAgent = new Agent({
  id: "fact-checker",
  name: "Fact Checker",
  purpose: "Verify information accuracy, detect bias, and ensure research integrity",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: factCheckerPrompt({
    standard: "multiple credible sources",
    sourceRequirements: "authoritative, recent, unbiased",
    confidenceLevels: "High (95%+), Medium (70-94%), Low (<70%)",
    biasIndicators: "sensationalism, one-sided arguments, lack of evidence",
    standards: "Maintain objectivity, cite all sources, acknowledge uncertainties",
    task: "Verify the accuracy of the provided information"
  }),
  tools: [verifyClaimTool, crossReferenceSourcesTool, detectBiasTool],
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
      voltlogger.info(`[${opId}] FactChecker starting`);
    },
    onEnd: ({ output, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] FactChecker error: ${errorMessage}`);
      } else if (output) {
        voltlogger.info(`[${opId}] FactChecker completed`);
      }
    },
    onToolStart: ({ tool, context }) => {
      const opId = context.context.get('opId') as string;
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
    },
    onToolEnd: ({ tool, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
    onPrepareMessages: ({ messages }) => {
      return { messages };
    },
  },
  temperature: 0.2, // Very low temperature for factual consistency
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
});
