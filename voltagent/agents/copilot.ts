import { Agent } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";

export const copilotAgent = new Agent({
  name: "github-copilot-agent",
  instructions: "You are a helpful assistant",

  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "github-copilot";
    const model = (context.get("model") as string) || "grok-code-fast-1";
    return `${provider}/${model}`;
  },
  toolkits: [],
  tools: [],
  maxOutputTokens: 8000,
  temperature: 0.2,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
});
