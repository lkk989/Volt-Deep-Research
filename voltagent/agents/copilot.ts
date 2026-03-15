import { Agent } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { basedRetriever } from "../retriever/based.js";
import { sharedWorkspaceRuntime } from "../workspaces/index.js";

export const copilotAgent = new Agent({
  id: "github-copilot-agent",
  name: "github-copilot-agent",
  purpose: "Provide lightweight assistant support for Copilot-oriented interactions.",
  instructions: "You are a helpful assistant",

  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-3.1-flash-lite-preview";
    return `${provider}/${model}`;
  },
  tools: [],
  toolkits: [],
  toolRouting: undefined,
  workspace: sharedWorkspaceRuntime,
  workspaceToolkits: false,
  workspaceSkillsPrompt: false,
  memory: false,
  summarization: false,
  conversationPersistence: {
    mode: "step",
    debounceMs: 200,
    flushOnToolResult: true,
  },
  retriever: basedRetriever,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: undefined,
  inputMiddlewares: [],
  outputMiddlewares: [],
  maxMiddlewareRetries: 3,
  maxOutputTokens: 8000,
  temperature: 0.2,
  maxSteps: 25,
  maxRetries: 3,
  feedback: true,
  stopWhen: undefined,
  markdown: true,
  inheritParentSpan: true,
  voice: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
  context: {
    provider: "google",
    model: "gemini-3.1-flash-lite-preview",
  },
  eval: {
    scorers: {},
  },
  inputGuardrails: [],
  outputGuardrails: [],
});
