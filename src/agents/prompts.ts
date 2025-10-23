import { createPrompt } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";

const agentPrompt = createPrompt({
  template: `You are an AI agent with the following capabilities: {{capabilities}}.
Your current goal is: {{goal}}
Available context: {{context}}
Task: {{task}}`,
  variables: {
    capabilities: "web search, code execution",
    goal: "Answer user queries",
    context: "No specific context yet",
    task: "", // Default task is empty
  },
});

const agentTaskPrompt = agentPrompt({
  goal: "Help the user solve a programming problem",
  context: "User is working with Node.js and Express",
  task: "Debug an error in a REST API endpoint",
});

voltlogger.info(agentTaskPrompt);
/*
Output:
You are an AI agent with the following capabilities: web search, code execution.
Your current goal is: Help the user solve a programming problem
Available context: User is working with Node.js and Express
Task: Debug an error in a REST API endpoint
*/

export { agentPrompt, agentTaskPrompt };
