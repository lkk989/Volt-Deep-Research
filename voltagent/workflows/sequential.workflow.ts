import { createWorkflowChain } from "@voltagent/core"
import { z } from "zod"
import { assistantAgent } from "../agents/assistant.agent.js"
import { scrapperAgent } from "../agents/scrapper.agent.js"
import { dataAnalyzerAgent } from "../agents/data-analyzer.agent.js"
import { factCheckerAgent } from "../agents/fact-checker.agent.js"
import { synthesizerAgent } from "../agents/synthesizer.agent.js"
import { writerAgent } from "../agents/writer.agent.js"

/**
 * Sequential Workflow - andThen: Chain steps sequentially
 */
export const sequentialWorkflow = createWorkflowChain({
    id: "sequential-research",
    name: "Sequential Research",
    purpose: "Chain agents sequentially: Query → Scrape → Analyze → FactCheck → Synthesize → Write",
    input: z.object({ topic: z.string() }),
    result: z.object({ topic: z.string(), report: z.string() }),
})
    .andThen({
        id: "queries",
        execute: async ({ data }) => {
            const res = await assistantAgent.generateText(`Generate search queries for: ${data.topic}`)
            return { ...data, queries: res.text }
        },
    })
    .andThen({
        id: "scrape",
        execute: async ({ data }) => {
            const res = await scrapperAgent.generateText(`Search: ${data.queries}`)
            return { ...data, scraped: res.text }
        },
    })
    .andThen({
        id: "analyze",
        execute: async ({ data }) => {
            const res = await dataAnalyzerAgent.generateText(`Analyze: ${data.scraped}`)
            return { ...data, analysis: res.text }
        },
    })
    .andThen({
        id: "factcheck",
        execute: async ({ data }) => {
            const res = await factCheckerAgent.generateText(`Verify: ${data.analysis}`)
            return { ...data, verified: res.text }
        },
    })
    .andThen({
        id: "synthesize",
        execute: async ({ data }) => {
            const res = await synthesizerAgent.generateText(`Synthesize: ${data.verified}`)
            return { ...data, synthesis: res.text }
        },
    })
    .andThen({
        id: "write",
        execute: async ({ data }) => {
            const res = await writerAgent.generateText(`Report: ${data.synthesis}`)
            return { topic: data.topic, report: res.text }
        },
    })
