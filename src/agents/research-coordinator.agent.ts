import { Agent, Memory, AiSdkEmbeddingAdapter, createHooks } from "@voltagent/core"
import { google } from "@ai-sdk/google"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltlogger } from "../config/logger.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
//import { searchDiscoveryToolkit } from "../tools/search-discovery-toolkit.js"
//import { contentAnalysisToolkit } from "../tools/content-analysis-toolkit.js"
//import { reportGenerationToolkit } from "../tools/report-generation-toolkit.js"
import z from "zod"

const researchCoordinatorMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/research-coordinator-memory.db" }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z.object({ name: z.string().optional(), role: z.string().optional(), timezone: z.string().optional() }).optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
      currentProject: z.object({ topic: z.string(), status: z.string(), subtasks: z.array(z.string()) }).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
})

const researchCoordinatorHooks = createHooks({
  onStart: async ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set("operationId", opId)
    context.context.set("startTime", new Date().toISOString())
    voltlogger.info(`[${opId}] Research Coordinator starting`, { agent: agent.name })
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
    if (error) {
      voltlogger.error(`[${opId}] Research Coordinator failed after ${duration}ms`, { error })
    } else {
      voltlogger.info(`[${opId}] Research Coordinator completed in ${duration}ms`)
    }
  },
})

export const researchCoordinatorAgent = new Agent({
  id: "research-coordinator",
  name: "Research Coordinator",
  purpose: "Orchestrate complex multi-step research projects by decomposing tasks, coordinating execution, and synthesizing results",
  model: google("gemini-2.5-flash-lite-preview-06-2025"),
  instructions: ({ context }) => {
    const role = context?.get("role") || "researcher"
    const tier = context?.get("tier") || "standard"
    
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
  memory: researchCoordinatorMemory,
  maxHistoryEntries: 100,
  temperature: 0.3,
  maxOutputTokens: 64000,
  maxSteps: 30,
  markdown: true,
  logger: voltlogger,
  hooks: researchCoordinatorHooks,
})
