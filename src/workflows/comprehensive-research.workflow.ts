import { createWorkflowChain } from "@voltagent/core"
import { z } from "zod"
import { assistantAgent } from "../agents/assistant.agent.js"
import { writerAgent } from "../agents/writer.agent.js"
import { dataAnalyzerAgent } from "../agents/data-analyzer.agent.js"
import { factCheckerAgent } from "../agents/fact-checker.agent.js"
import { synthesizerAgent } from "../agents/synthesizer.agent.js"
import { scrapperAgent } from "../agents/scrapper.agent.js"
import { directorAgent } from "../agents/director.agent.js"
import { voltlogger } from "../config/logger.js"

/**
 * Sequential Workflow - andThen only
 * Basic sequential steps using all agents
 */
export const sequentialWorkflow = createWorkflowChain({
    id: "comprehensive-research",
    name: "Comprehensive Research Workflow",
    purpose: "Complete research pipeline using all agents: query generation, web scraping, data analysis, fact-checking, synthesis, and report writing",
    
    input: z.object({
        topic: z.string().min(1).describe("Research topic"),
    }),
    
    result: z.object({
        topic: z.string(),
        queries: z.string(),
        scrapedData: z.string(),
        analysis: z.string(),
        factCheck: z.string(),
        synthesis: z.string(),
        finalReport: z.string(),
    }),
})
    .andTap({
        id: "log-start",
        execute: async ({ data }) => {
            voltlogger.info(`=== Starting comprehensive research on: ${data.topic} ===`)
        },
    })
    
    // Step 1: Generate search queries
    .andThen({
        id: "generate-queries",
        execute: async ({ data }) => {
            voltlogger.info("Step 1: Generating search queries...")
            const result = await assistantAgent.generateText(
                `Generate 5 diverse search queries for research on: ${data.topic}`
            )
            return { queries: result.text }
        },
    })
    
    // Step 2: Scrape web data
    .andThen({
        id: "scrape-data",
        execute: async ({ data }) => {
            voltlogger.info("Step 2: Scraping web data...")
            const result = await scrapperAgent.generateText(
                `Search and scrape relevant data for these queries:\n${data.queries}\n\nTopic: ${data.queries}`
            )
            return { scrapedData: result.text }
        },
    })
    
    // Step 3: Analyze data
    .andThen({
        id: "analyze-data",
        execute: async ({ data }) => {
            voltlogger.info("Step 3: Analyzing data...")
            const result = await dataAnalyzerAgent.generateText(
                `Analyze this scraped data:\n${data.scrapedData}`
            )
            return { analysis: result.text }
        },
    })
    
    // Step 4: Fact-check findings
    .andThen({
        id: "fact-check",
        execute: async ({ data }) => {
            voltlogger.info("Step 4: Fact-checking...")
            const result = await factCheckerAgent.generateText(
                `Fact-check these findings:\n${data.analysis}`
            )
            return { factCheck: result.text }
        },
    })
    
    // Step 5: Synthesize information
    .andThen({
        id: "synthesize",
        execute: async ({ data }) => {
            voltlogger.info("Step 5: Synthesizing information...")
            const result = await synthesizerAgent.generateText(
                `Synthesize this fact-checked analysis:\n${data.factCheck}`
            )
            return { synthesis: result.text }
        },
    })
    
    // Step 6: Write final report
    .andThen({
        id: "write-report",
        execute: async ({ data }) => {
            voltlogger.info("Step 6: Writing final report...")
            const result = await writerAgent.generateText(
                `Write a comprehensive research report based on:\n${data.synthesis}`
            )
            return { finalReport: result.text }
        },
    })
    
    // Step 7: Assemble final result
    .andThen({
        id: "finalize",
        execute: async ({ data, getStepData }) => {
            const topic = getStepData("log-start")?.input?.topic || ""
            const queries = getStepData("generate-queries")?.output?.queries || ""
            const scrapedData = getStepData("scrape-data")?.output?.scrapedData || ""
            const analysis = getStepData("analyze-data")?.output?.analysis || ""
            const factCheck = getStepData("fact-check")?.output?.factCheck || ""
            const synthesis = getStepData("synthesize")?.output?.synthesis || ""
            
            voltlogger.info("=== Research workflow complete ===")
            
            return {
                topic,
                queries,
                scrapedData,
                analysis,
                factCheck,
                synthesis,
                finalReport: data.finalReport,
            }
        },
    })
