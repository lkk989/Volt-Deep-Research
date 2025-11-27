import { google } from "@ai-sdk/google";
import { Agent, AiSdkEmbeddingAdapter, Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import z from "zod";

import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { assistantAgent } from "./assistant.agent.js";
import { dataAnalyzerAgent } from "./data-analyzer.agent.js";
import { factCheckerAgent } from "./fact-checker.agent.js";
import { agentPrompt } from "./prompts.js"; // kept single import
import { scrapperAgent } from "./scrapper.agent.js";
import { synthesizerAgent } from "./synthesizer.agent.js";
import { writerAgent } from "./writer.agent.js";

// Local SQLite for director
const directorMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/director-memory.db",
  }),
  workingMemory: {
    enabled: true,
    scope: "user",
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
      researchState: z.object({
        currentPhase: z.string().optional(),
        topic: z.string().optional(),
        depth: z.string().optional(),
        quality: z.string().optional(),
      }).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
});

export const directorAgent = new Agent({
  id: "director",
  name: "Director",
  purpose: "Orchestrate comprehensive research projects using specialized agents for optimal results",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  // Use a string representation of the PromptCreator to satisfy the expected instructions type
  instructions: agentPrompt({
    agentName: "Director",
    role: "research orchestration specialist",
    researchPhase: "planning",
    qualityLevel: "high",
    capabilities: "multi-agent coordination, workflow management",
    topic: "research projects",
    depth: "comprehensive",
    expertise: "expert",
    tools: "agent delegation, reasoning",
    responsibilities: "Coordinate specialized agents for research tasks",
    standards: "Ensure quality, accuracy, and efficiency",
    task: "Orchestrate research workflows"
  }),
  tools: [],
  toolkits: [thinkOnlyToolkit],
  memory: directorMemory,
  retriever: undefined,
  subAgents: [assistantAgent, writerAgent, dataAnalyzerAgent, factCheckerAgent, synthesizerAgent, scrapperAgent],
  supervisorConfig: {
    customGuidelines: [
      "For research queries: Start with Assistant → Scrapper → DataAnalyzer → FactChecker → Synthesizer → Writer",
      "For web scraping tasks: Delegate directly to Scrapper agent for data extraction from URLs",
      "For URL-based content collection: Use Scrapper to gather web data before delegating to analyzers",
      "For data analysis tasks: Delegate directly to DataAnalyzer with context",
      "For fact-checking requests: Route through FactChecker with source verification",
      "For synthesis needs: Use Synthesizer to integrate multiple perspectives",
      "For report writing: Provide Writer with verified, synthesized information",
      "Always maintain research integrity by routing claims through FactChecker",
      "Use DataAnalyzer to extract insights from raw research data",
      "Employ Synthesizer for complex multi-source integration projects",
      "Monitor agent performance and adjust workflows as needed",
      "Ensure all final outputs meet enterprise quality standards"
    ],
    fullStreamEventForwarding: {
      // Use a plain array of string literals instead of TypeScript union expressions
      types: [
        "file",
        "error",
        "abort",
        "source",
        "tool-call",
        "tool-result",
        "tool-error",
        "text-start",
        "text-end",
        "text-delta",
        "reasoning-start",
        "reasoning-end",
        "reasoning-delta",
        "tool-input-start",
        "tool-input-end",
        "tool-input-delta",
        "start-step",
        "finish-step",
        "start",
        "finish",
        "raw",
      ],
    },
    includeErrorInEmptyResponse: true,
    throwOnStreamError: false,
  },
  maxHistoryEntries: 100,
  hooks: {
    onStart: async ({ agent, context }) => {
      const opId = Math.random().toString(36).substr(2, 9);
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] ${agent.name} started`);
    },
    onEnd: async ({ agent, output, error, context }) => {
      const opId = context.context.get('opId');
      if (error) {
        voltlogger.error(`[${opId}] ${agent.name} error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] ${agent.name} completed`);
      }
    },
    onToolStart: async ({ tool, context }) => {
      const opId = context.context.get('opId');
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = context.context.get('opId');
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
    onPrepareMessages: async ({ messages }) => {
      return { messages };
    },
    onHandoff: async ({ agent, sourceAgent }) => {
      voltlogger.info(`${sourceAgent.name} → ${agent.name}`);
    }
  },
  inputGuardrails: [],
  outputGuardrails: [],
  temperature: 0.3, // Lower temperature for consistent orchestration
  maxOutputTokens: 64000,
  maxSteps: 30, // More steps for complex orchestration
  stopWhen: undefined,
  markdown: true,
  voice: undefined,
  context: undefined,
  eval: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
});
