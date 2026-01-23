import { google } from "@ai-sdk/google";
import { Agent, AiSdkEmbeddingAdapter, createTool, Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import z from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { dataAnalyzerPrompt } from "./prompts.js";
import { analyzeDataTool, extractInsightsTool } from "../tools/analyze-data-tool.js";


export const dataAnalyzerAgent = new Agent({
  id: "data-analyzer",
  name: "Data Analyzer",
  purpose: "Analyze research data, extract patterns and insights, and provide data-driven conclusions",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: dataAnalyzerPrompt({
    dataType: "research data",
    focus: "patterns and insights",
    confidence: "high",
    format: "structured markdown",
    standards: "Use evidence-based conclusions, quantify findings where possible",
    task: "Analyze the provided data and extract key insights"
  }),
  tools: [analyzeDataTool, extractInsightsTool],
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
      voltlogger.info(`[${opId}] DataAnalyzer starting`);
    },
    onToolStart: ({ tool, context }) => {
      const opId = context.context.get('opId') as string;
      voltlogger.info(`[${opId}] tool: ${String(tool.name)}`);
    },
    onToolEnd: ({ tool, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
    onEnd: ({ output, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] DataAnalyzer error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] DataAnalyzer completed`);
      }
    },
    onPrepareMessages: ({ messages }) => {
      return { messages };
    },
  },
  temperature: 0.3, // Lower temperature for more consistent analysis
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
});
