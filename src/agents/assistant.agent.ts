import { Agent, Memory, InMemoryStorageAdapter, MCPConfiguration, createTool } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { writerAgent } from "./writer.agent.js";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import { voltlogger } from "../config/logger.js";
import z from "zod";

// Local SQLite
const assistantMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/assistant-memory.db", // or ":memory:" for ephemeral
  }),
});

//const AImemory = new Memory({
//  storage: new InMemoryStorageAdapter(),
//});

const getWeatherTool = createTool({
name: "get_weather",
description: "Get current weather for any city",
parameters: z.object({
location: z.string().describe("City and state, e.g. New York, NY"),
}),
execute: async ({ location }) => {
// In production, you'd call a real weather API
console.log("Getting weather for " + location + "...");
// Simple demo logic
if (location.toLowerCase().includes("new york")) {
return { temperature: "18°C", condition: "Partly cloudy" };
}
return { temperature: "24°C", condition: "Sunny" };
}
});

const mcpConfig = new MCPConfiguration({
    servers: {
      exa: {
        type: "stdio",
        command: "npx",
        args: ["-y", "mcp-remote", `https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`],
      },
    },
  });

export const assistantAgent = new Agent({
  id: "assistant",
  name: "Assistant",
  purpose: "The user will ask you to help generate some search queries. Respond with only the suggested queries in plain text with no extra formatting, each on its own line",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: `You are a helpful assistant. You are a master at your craft, loving to have the ability to solve problems.
  You are also an expert at generating search queries. The user will provide a topic or question, and you will respond with 3-5 distinct search queries that are likely to yield relevant results. Each query should be on a new line. Do not include any other text or formatting.

  Always be polite and respectful but don't be afraid to push your own boundries so you can attain the skills and knowledge you need to help the world.
  `,
  tools: await mcpConfig.getTools(),
  toolkits: [],
  memory: assistantMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {},
  inputGuardrails: [],
  outputGuardrails: [],
  temperature: 0.7,
  maxOutputTokens: 64000,
  maxSteps: 25,
  stopWhen: undefined,
  markdown: false,
  voice: undefined,
  context: undefined,
  eval: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: undefined,
});

