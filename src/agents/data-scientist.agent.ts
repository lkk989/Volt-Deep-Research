import { Agent, Memory, AiSdkEmbeddingAdapter, createHooks } from "@voltagent/core"
import { google } from "@ai-sdk/google"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltlogger } from "../config/logger.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
import { dataProcessingToolkit } from "../tools/data-processing-toolkit.js"
import z from "zod"

const dataScientistMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/data-scientist-memory.db" }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z.object({ name: z.string().optional(), role: z.string().optional(), timezone: z.string().optional() }).optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
      analysisHistory: z.array(z.object({ datasetId: z.string(), analysisType: z.string(), timestamp: z.string() })).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
})

const dataScientistHooks = createHooks({
  onStart: async ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set("operationId", opId)
    context.context.set("startTime", new Date().toISOString())
    context.context.set("toolExecutions", [])
    voltlogger.info(`[${opId}] Data Scientist starting`, { agent: agent.name })
  },
  onToolStart: async ({ tool, context, args: toolArgs }) => {
    const opId = context.context.get("operationId")
    const toolStart = new Date().toISOString()
    context.context.set(`tool_${tool.name}_start`, toolStart)
    voltlogger.info(`[${opId}] Tool starting: ${tool.name}`, { toolArgs })
  },
  onToolEnd: async ({ tool, output, error, context }) => {
    const opId = context.context.get("operationId")
    const toolStart = context.context.get(`tool_${tool.name}_start`) as string
    const duration = toolStart ? new Date().getTime() - new Date(toolStart).getTime() : 0
    const executions = (context.context.get("toolExecutions") as unknown[]) || []
    executions.push({ tool: tool.name, duration, success: !error, timestamp: new Date().toISOString() })
    context.context.set("toolExecutions", executions)
    if (error) {
      voltlogger.error(`[${opId}] Tool failed: ${tool.name} (${duration}ms)`, { error })
    } else {
      voltlogger.info(`[${opId}] Tool completed: ${tool.name} (${duration}ms)`)
    }
  },
  onEnd: async ({ agent, output, error, context }) => {
    const opId = context.context.get("operationId")
    const startTime = context.context.get("startTime") as string
    const duration = new Date().getTime() - new Date(startTime).getTime()
    const executions = context.context.get("toolExecutions")
    voltlogger.info(`[${opId}] Data Scientist completed in ${duration}ms`, { toolExecutions: executions })
  },
})

export const dataScientistAgent = new Agent({
  id: "data-scientist",
  name: "Data Scientist",
  purpose: "Perform statistical analysis, extract insights from datasets, and generate data-driven hypotheses",
  model: ({ context }) => {
    const complexity = context?.get("complexity") || "standard"
    if (complexity === "high") {
      return google("gemini-2.5-flash-preview-06-2025")
    }
    return google("gemini-2.5-flash-lite-preview-06-2025")
  },
  instructions: ({ context }) => {
    const analysisType = context?.get("analysisType") || "exploratory"
    
    let baseInstructions = `You are a Data Scientist agent specialized in statistical analysis and data-driven insights.

Your responsibilities:
1. Perform exploratory data analysis (EDA) on datasets
2. Compute descriptive statistics and perform hypothesis testing
3. Identify patterns, correlations, and anomalies
4. Generate data-driven hypotheses and recommendations
5. Provide confidence intervals and statistical significance measures
6. Create clear visualizations and explanations

Statistical Methodology:
- Always start with data quality assessment
- Use appropriate statistical tests based on data characteristics
- Report effect sizes alongside p-values
- Consider multiple hypothesis correction when needed
- Clearly communicate uncertainty and limitations`

    if (analysisType === "predictive") {
      baseInstructions += "\n\nFocus on predictive modeling and forecasting techniques."
    } else if (analysisType === "causal") {
      baseInstructions += "\n\nFocus on causal inference and experimental design."
    }
    
    return baseInstructions
  },
  tools: [],
  toolkits: [thinkOnlyToolkit, dataProcessingToolkit],
  memory: dataScientistMemory,
  maxHistoryEntries: 100,
  temperature: 0.2,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  hooks: dataScientistHooks,
})
