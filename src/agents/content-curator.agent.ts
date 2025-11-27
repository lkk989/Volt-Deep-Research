import { Agent, Memory, AiSdkEmbeddingAdapter, createHooks } from "@voltagent/core"
import { google } from "@ai-sdk/google"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltlogger } from "../config/logger.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
import { contentAnalysisToolkit } from "../tools/content-analysis-toolkit.js"
import { sentimentBiasToolkit } from "../tools/sentiment-bias-toolkit.js"
import z from "zod"

const contentCuratorMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/content-curator-memory.db" }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z.object({ name: z.string().optional(), role: z.string().optional(), timezone: z.string().optional() }).optional(),
      preferences: z.object({
        topics: z.array(z.string()).optional(),
        qualityThreshold: z.number().optional(),
        sources: z.array(z.string()).optional(),
      }).optional(),
      goals: z.array(z.string()).optional(),
      curationHistory: z.array(z.object({ contentId: z.string(), action: z.string(), timestamp: z.string() })).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
})

const contentCuratorHooks = createHooks({
  onStart: async ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set("operationId", opId)
    context.context.set("startTime", new Date().toISOString())
    context.context.set("curationDecisions", [])
    voltlogger.info(`[${opId}] Content Curator starting`, { agent: agent.name })
  },
  onToolStart: async ({ tool, context, args: toolArgs }) => {
    const opId = context.context.get("operationId")
    voltlogger.info(`[${opId}] Tool starting: ${tool.name}`, { toolArgs })
  },
  onToolEnd: async ({ tool, output, error, context }) => {
    const opId = context.context.get("operationId")
    if (error) {
      voltlogger.error(`[${opId}] Tool failed: ${tool.name}`, { error })
    } else {
      voltlogger.info(`[${opId}] Tool completed: ${tool.name}`)
    }
  },
  onEnd: async ({ agent, output, error, context }) => {
    const opId = context.context.get("operationId")
    const startTime = context.context.get("startTime") as string
    const duration = new Date().getTime() - new Date(startTime).getTime()
    const decisions = context.context.get("curationDecisions")
    voltlogger.info(`[${opId}] Content Curator completed in ${duration}ms`, { decisions })
  },
})

export const contentCuratorAgent = new Agent({
  id: "content-curator",
  name: "Content Curator",
  purpose: "Evaluate, organize, and recommend content based on quality, relevance, and user preferences",
  model: google("gemini-2.5-flash-lite-preview-06-2025"),
  instructions: ({ context }) => {
    const userPrefs = context?.get("userPreferences") as Record<string, unknown> | undefined
    const contentType = context?.get("contentType") || "general"
    
    let baseInstructions = `You are a Content Curator agent specialized in evaluating and organizing information.

Your responsibilities:
1. Evaluate content quality, relevance, and credibility
2. Organize content by topic, source, and quality tier
3. Detect and flag duplicates or low-quality items
4. Provide personalized recommendations based on user preferences
5. Maintain metadata and audit trails for all curation decisions
6. Adapt curation criteria based on context and feedback

Curation Methodology:
- Assess source credibility and authority
- Check for factual accuracy and bias
- Evaluate relevance to user interests
- Consider recency and timeliness
- Track curation decisions for transparency`

    if (userPrefs) {
      const topics = userPrefs.topics as string[] | undefined
      if (topics && topics.length > 0) {
        baseInstructions += `\n\nUser's preferred topics: ${topics.join(", ")}`
      }
      const threshold = userPrefs.qualityThreshold as number | undefined
      if (threshold) {
        baseInstructions += `\n\nMinimum quality threshold: ${threshold}/10`
      }
    }

    if (contentType === "academic") {
      baseInstructions += "\n\nFocus on peer-reviewed sources and academic rigor."
    } else if (contentType === "news") {
      baseInstructions += "\n\nPrioritize recency and source diversity."
    }
    
    return baseInstructions
  },
  tools: ({ context }) => {
    const role = context?.get("role") || "user"
    // Base tools available to all users
    const baseTools: never[] = []
    // Admin-only tools could be added here
    if (role === "admin") {
      // Add admin-specific tools
    }
    return baseTools
  },
  toolkits: [thinkOnlyToolkit, contentAnalysisToolkit, sentimentBiasToolkit],
  memory: contentCuratorMemory,
  maxHistoryEntries: 100,
  temperature: 0.4,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  hooks: contentCuratorHooks,
})
