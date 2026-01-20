import { Agent } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";

const agent = new Agent({
  name: "github-copilot-agent",
  instructions: "You are a helpful assistant",
  model: "github-copilot/claude-haiku-4.5",
  toolkits: [],
  tools: [],
  maxOutputTokens: 8000,
  temperature: 0.2,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
});
