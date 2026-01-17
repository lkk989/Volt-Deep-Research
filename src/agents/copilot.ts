import { Agent } from "@voltagent/core";

const agent = new Agent({
  name: "github-copilot-agent",
  instructions: "You are a helpful assistant",
  model: "github-copilot/claude-haiku-4.5",
});
