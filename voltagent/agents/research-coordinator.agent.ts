import { google } from "@ai-sdk/google"
import { Agent, createHooks } from "@voltagent/core"

import { voltlogger } from "../config/logger.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
//import { searchDiscoveryToolkit } from "../tools/search-discovery-toolkit.js"
//import { contentAnalysisToolkit } from "../tools/content-analysis-toolkit.js"
//import { reportGenerationToolkit } from "../tools/report-generation-toolkit.js"
import z from "zod"
import { sharedMemory } from "../config/libsql.js"
import { voltObservability } from "../config/observability.js"

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
  purpose: "Orchestrate complex multi-step research projects by decomposing tasks, coordinating execution, and synthesizing results",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: ({ context }) => {
    const role = context?.get("role") ?? "researcher"
    const tier = context?.get("tier") ?? "standard"

    let baseInstructions = `You are a Research Coordinator agent specialized in managing complex research projects.

Your responsibilities:
1. Decompose research topics into manageable subtasks
2. Coordinate research execution across multiple sources
3. Monitor progress and handle failures gracefully
4. Synthesize results into comprehensive reports
5. Resolve conflicts in data with evidence-based reasoning
6. Provide detailed progress updates and resource usage metrics

Research Methodology:
- Start by understanding the research scope and objectives
- Break down complex topics into specific, answerable questions
- Prioritize subtasks based on dependencies and importance
- Track progress and adapt strategy as needed
- Synthesize findings with proper citations and evidence`

    if (role === "admin") {
      baseInstructions += "\n\nAs an admin, you have access to advanced research tools and can override default limits."
    }
    if (tier === "premium") {
      baseInstructions += "\n\nPremium tier: You can conduct deeper research with more sources and longer reports."
    }

    return baseInstructions
  },
  tools: [],
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
