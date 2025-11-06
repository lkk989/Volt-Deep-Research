import { createWorkflowChain } from "@voltagent/core"
import { z } from "zod"
import { assistantAgent } from "../agents/assistant.agent.js"
import { dataAnalyzerAgent } from "../agents/data-analyzer.agent.js"
import { writerAgent } from "../agents/writer.agent.js"

/**
 * AI Agent Workflow - andAgent for structured output
 */
export const aiAgentWorkflow = createWorkflowChain({
    id: "ai-agent-workflow",
    name: "AI Agent Workflow",
    purpose: "Demonstrates andAgent with structured output schemas",
    input: z.object({ topic: z.string() }),
    result: z.object({
        queries: z.array(z.string()),
        analysis: z.object({ score: z.number(), summary: z.string() }),
        report: z.string(),
    }),
})
    .andAgent(
        async ({ data }) => `Generate 5 search queries for: ${data.topic}`,
        assistantAgent,
        { schema: z.object({ queries: z.array(z.string()) }) }
    )
    .andAgent(
        async ({ data }) => `Analyze these queries: ${data.queries.join(", ")}`,
        dataAnalyzerAgent,
        { schema: z.object({ score: z.number(), summary: z.string() }) }
    )
    .andAgent(
        async ({ data }) => `Write report: ${data.summary}`,
        writerAgent,
        { schema: z.object({ report: z.string() }) }
    )
    .andThen({
        id: "final",
        execute: async ({ data, getStepData }) => ({
            queries: getStepData("step-1")?.output?.queries || [],
            analysis: getStepData("step-2")?.output || { score: 0, summary: "" },
            report: data.report,
        }),
    })
