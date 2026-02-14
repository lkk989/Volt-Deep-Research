import { google } from "@ai-sdk/google"
import { Agent, createHooks } from "@voltagent/core"

import { voltlogger } from "../config/logger.js"
import { apiIntegrationToolkit } from "../tools/api-integration-toolkit.js"
import { debugTool } from "../tools/debug-tool.js"
import { ragToolkit } from "../tools/rag-toolkit.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
//import { searchDiscoveryToolkit } from "../tools/search-discovery-toolkit.js"
//import { contentAnalysisToolkit } from "../tools/content-analysis-toolkit.js"
//import { reportGenerationToolkit } from "../tools/report-generation-toolkit.js"
import z from "zod"
import { sharedMemory } from "../config/libsql.js"
import { voltObservability } from "../config/observability.js"
import { sharedWorkspaceFilesystemToolkit, sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from "../workspaces/index.js"
import { researchCoordinatorPrompt } from "./prompts.js"

const researchCoordinatorHooks = createHooks({
  onStart: async ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set("operationId", opId)
    context.context.set("startTime", new Date().toISOString())
    voltlogger.info(`[${opId}] Research Coordinator starting`, { agent: agent.name })
    return undefined
  },
  onToolStart: async ({ tool, context, args: toolArgs }) => {
    const opId = context.context.get("operationId") as string
    voltlogger.info(`[${opId}] Tool starting: ${tool.name}`, { toolArgs: toolArgs as unknown })
    return undefined
  },
  onToolEnd: async ({ tool, error, context }) => {
    const opId = context.context.get("operationId") as string
    if (error) {
      voltlogger.error(`[${opId}] Tool failed: ${tool.name}`, { error })
    } else {
      voltlogger.info(`[${opId}] Tool completed: ${tool.name}`)
    }
    return undefined
  },
  onEnd: async ({ error, context }) => {
    const opId = context.context.get("operationId") as string
    const startTime = context.context.get("startTime") as string
    const duration = new Date().getTime() - new Date(startTime).getTime()
    if (error) {
      voltlogger.error(`[${opId}] Research Coordinator failed after ${duration}ms`, { error })
    } else {
      voltlogger.info(`[${opId}] Research Coordinator completed in ${duration}ms`)
    }
    return undefined
  },
})

export const researchCoordinatorAgent = new Agent({
  id: "research-coordinator",
  name: "Research Coordinator",
  purpose: "Translate ambiguous goals into dependency-aware execution plans, coordinate specialists, and return auditable milestone outcomes.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: ({ context }) => {
    const role = String(context?.get("role") ?? "researcher")
    const tier = String(context?.get("tier") ?? "standard")
    return researchCoordinatorPrompt({
      userRole: role,
      tier,
      scope: tier === "premium" ? "deep, cross-domain multi-source orchestration" : "standard multi-source orchestration",
      timeConstraint: "adaptive",
      tools: "reasoning, API integration, RAG, workspace search/skills, debug diagnostics",
      qualityBar: "Clear delegation contracts, verifiable outputs, explicit status tracking, and acceptance criteria per milestone.",
      riskControls: "No uncited claims, no skipped verification, no unresolved blockers without mitigation plan, no silent task drops.",
      task: "Coordinate end-to-end research execution with milestone reporting and conflict-resolution decisions.",
    })
  },
  tools: [debugTool],
  toolkits: [
    thinkOnlyToolkit,
    apiIntegrationToolkit,
    ragToolkit,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
  ],
  workspace: sharedWorkspaceFilesystemToolkit,
  workspaceToolkits: {},
  workspaceSkillsPrompt: true,
  toolRouting: {
    embedding: {
      model: 'google/gemini-embedding-001',
      normalize: true,
      topK: 3,
      toolText: (tool) => {
        const tags = tool.tags?.join(", ") ?? "";
        return [tool.name, tool.description, tags].filter(Boolean).join("\n");
      },
    },
  },
  memory: sharedMemory,
  maxHistoryEntries: 100,
  temperature: 0.3,
  maxOutputTokens: 64000,
  maxSteps: 30,
  markdown: true,
  logger: voltlogger,
  hooks: researchCoordinatorHooks,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
})
