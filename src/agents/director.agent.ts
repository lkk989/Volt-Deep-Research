import { Agent, Memory, createTool, VoltAgentObservability, AiSdkEmbeddingAdapter } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { writerAgent } from "./writer.agent.js";
import { assistantAgent } from "./assistant.agent.js";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { voltlogger } from "../config/logger.js";
import { createSubagent } from "@voltagent/core";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import z from "zod";
// Local SQLite for director
const directorMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/director-memory.db", // or ":memory:" for ephemeral
  }),
  workingMemory: {
    enabled: true,
    scope: "user", // persist across conversations
    schema: z.object({
      profile: z
        .object({
          name: z.string().optional(),
          role: z.string().optional(),
          timezone: z.string().optional(),
        })
        .optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }), // or InMemoryVectorAdapter() for dev
  enableCache: true, // optional embedding cache
});

export const directorAgent = new Agent({
  id: "director",
  name: "directorAgnt",
  purpose: "The user will ask you to help generate some search queries. Respond with only the suggested queries in plain text with no extra formatting, each on its own lineYou are a director agent that oversees the creation of a story. You will interact with the user to understand their preferences, then delegate tasks to sub-agents (writer and assistant) to generate the story. Finally, you will present the complete story to the user, adhering to all custom guidelines.",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: `You are a helpful assistant. You are a master at your craft, loving to have the ability to solve problems.
  You are also an expert at generating search queries. The user will provide a topic or question, and you will respond with 3-5 distinct search queries that are likely to yield relevant results. Each query should be on a new line. Do not include any other text or formatting.

  Always be polite and respectful but don't be afraid to push your own boundries so you can attain the skills and knowledge you need to help the world.
  `,
  tools: [],
  toolkits: [thinkOnlyToolkit],
  memory: directorMemory,
  retriever: undefined,
  subAgents: [writerAgent, assistantAgent],
  supervisorConfig: {
    customGuidelines: [
      "Always ask user about preferred story genre first",
      "Include word count in final response",
      "Thank the team members by name",
      "Offer to create illustrations for stories"
    ]
  },
  maxHistoryEntries: 100,
  hooks: {
    onHandoff: ({ agent, sourceAgent }) => {
      voltlogger.info(`${sourceAgent.name} → ${agent.name}`);
      // Output: "creative-director → writer"
      // Output: "creative-director → assistant"
    }
  },
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
