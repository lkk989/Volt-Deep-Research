
import { Agent, createHooks } from "@voltagent/core"
import { voltlogger } from "../config/logger.js"
import { knowledgeGraphToolkit } from "../tools/knowledge-graph-toolkit.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
//import { contentAnalysisToolkit } from "../tools/content-analysis-toolkit.js"
//import { sentimentBiasToolkit } from "../tools/sentiment-bias-toolkit.js"

import { sharedMemory } from "../config/libsql.js"
import { voltObservability } from "../config/observability.js"
import { sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from "../workspaces/index.js"
import { contentCuratorPrompt } from "./prompts.js"

const contentCuratorHooks = createHooks({
  onStart: ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set("operationId", opId)
    context.context.set("startTime", new Date().toISOString())
    context.context.set("curationDecisions", [])
    voltlogger.info(`[${opId}] Content Curator starting`, { agent: agent?.name })
  },
  onToolStart: ({ tool, context, args }) => {
    const opId = String(context.context.get("operationId") ?? "unknown")
    let argsString: string
    try {
      argsString = JSON.stringify(args)
    } catch {
      argsString = String(args)
    }
    voltlogger.info(`[${opId}] Tool starting: ${String(tool?.name)}`, { args: argsString })
  },
  onToolEnd: async ({ tool, error, context }) => {
    const opId = String(context.context.get("operationId") ?? "unknown")
    if (error) {
      voltlogger.error(`[${opId}] Tool failed: ${String(tool?.name)}`, { error })
    } else {
      voltlogger.info(`[${opId}] Tool completed: ${String(tool?.name)}`)
    }
  },
  onEnd: ({ agent, output, error, context }) => {
    const opId = String(context.context.get("operationId") ?? "unknown")
    const startTimeStr = String(context.context.get("startTime") ?? new Date().toISOString())
    const duration = new Date().getTime() - new Date(startTimeStr).getTime()
    const decisions = (context.context.get("curationDecisions") as any[]) ?? []
    if (error) {
      voltlogger.error(`[${opId}] Content Curator ended with error in ${duration}ms`, {
        agent: agent?.name,
        error,
        output,
        decisions,
      })
    } else {
      const outputSummary = (() => {
        if (typeof output === "string") {
          const str = output as string
          return str.length > 240 ? `${str.slice(0, 240)}...` : str
        }
        if (output !== undefined && output !== null) {
          return "non-string output"
        }
        return null
      })()
      voltlogger.info(`[${opId}] Content Curator completed in ${duration}ms`, {
        agent: agent?.name,
        outputSummary,
        decisions,
      })
    }
  },
})

export const contentCuratorAgent = new Agent({
  id: "content-curator",
  name: "Content Curator",
  purpose: "Score, de-duplicate, and prioritize content into high-value evidence bundles aligned with user goals.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: ({ context }) => {
    const userPrefs = (context?.get("userPreferences") as Record<string, unknown> | undefined) ?? {}
    const topics = Array.isArray(userPrefs.topics) ? (userPrefs.topics as string[]) : []
    const threshold = typeof userPrefs.qualityThreshold === "number" ? userPrefs.qualityThreshold : 7
    const contentType = String(context?.get("contentType") ?? "general")

    return contentCuratorPrompt({
      contentType,
      userTopics: topics.length > 0 ? topics.join(", ") : "general",
      qualityThreshold: `${threshold}/10`,
      tools: "knowledge graph toolkit, workspace search/skills, reasoning toolkit",
      standards: contentType === "academic"
        ? "Prioritize peer-reviewed evidence, methodological rigor, and citation quality."
        : contentType === "news"
          ? "Prioritize recency, source diversity, and corroboration across outlets."
          : "Prioritize credibility, relevance, and explainable ranking decisions.",
      task: "Curate, de-duplicate, score, and return ranked content bundles with rationale and next-read recommendations.",
    })
  },
  tools: ({ context }) => {
    const role = context?.get("role") ?? "user"
    // Base tools available to all users
    const baseTools: never[] = []
    // Admin-only tools could be added here
    if (role === "admin") {
      // Add admin-specific tools
    }
    return baseTools
  },
  toolkits: [
    thinkOnlyToolkit,
    knowledgeGraphToolkit,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
  ],
  toolRouting: {
    embedding: {
      model: "google/gemini-embedding-001",
      topK: 3,
      toolText: (tool) => {
        const tags = tool.tags?.join(", ") ?? "";
        return [tool.name, tool.description, tags].filter(Boolean).join("\n");
      },
    },
  },
  memory: sharedMemory,
  maxHistoryEntries: 100,
  temperature: 0.4,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  hooks: contentCuratorHooks,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
})
