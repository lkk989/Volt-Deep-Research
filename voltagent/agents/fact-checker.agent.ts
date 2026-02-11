import { Agent } from "@voltagent/core";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { crossReferenceSourcesTool, detectBiasTool, verifyClaimTool } from "../tools/analyze-data-tool.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { defaultAgentHooks } from "./agentHooks.js";
import { factCheckerPrompt } from "./prompts.js";

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
      voltlogger.info(`[${opId}] FactChecker starting`);
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] tool ${tool.name} failed: ${errorMessage}`);
        if (error instanceof Error) {
          const {stack} = error;
          if (typeof stack === 'string' && stack.length > 0) {
            voltlogger.debug(`[${opId}] tool ${tool.name} stack: ${stack}`);
          } else {
            voltlogger.debug(`[${opId}] tool ${tool.name} stack: <no stack available>`);
          }
        }
      } else {
        voltlogger.info(`[${opId}] tool ${tool.name} completed`);
      }
      // Ensure this hook returns a Promise<void> and satisfies async lint rules.
      await Promise.resolve();
    },

    onEnd: async ({ output, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] FactChecker error: ${errorMessage}`);
      } else if (output) {
        voltlogger.info(`[${opId}] FactChecker completed`);
      }
      await Promise.resolve();
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
