import { createWorkflowChain } from '@voltagent/core'
import { z } from 'zod'
import { assistantAgent } from '../agents/assistant.agent.js'
import { writerAgent } from '../agents/writer.agent.js'
import { dataAnalyzerAgent } from '../agents/data-analyzer.agent.js'
import { factCheckerAgent } from '../agents/fact-checker.agent.js'
import { synthesizerAgent } from '../agents/synthesizer.agent.js'
import { scrapperAgent } from '../agents/scrapper.agent.js'
import { voltlogger } from '../config/logger.js'

/**
 * Sequential Workflow - andThen only
 * Basic sequential steps using all agents
 */
export const comprehensiveResearchWorkflow = createWorkflowChain({
    id: 'comprehensive-research',
    name: 'Comprehensive Research Workflow',
    purpose:
        'Complete research pipeline using all agents: query generation, web scraping, data analysis, fact-checking, synthesis, and report writing',
    input: z.object({
        topic: z.string().min(1).describe('Research topic'),
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
        id: 'log-start',
        inputSchema: z.object({
            topic: z.string(),
        }),
        execute: ({ data }) => {
            voltlogger.info(
                `=== Starting comprehensive research on: ${data.topic} ===`
            )
            return Promise.resolve()
        },
    })

    // Step 1: Generate search queries
    .andThen({
        id: 'generate-queries',
        execute: async ({ data, writer }) => {
            voltlogger.info('Step 1: Generating search queries...')
            const response = await assistantAgent.streamText(
                `Generate 5 diverse search queries for research on: ${data.topic}`
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'assistant-',
                    agentId: 'assistant',
                })
            }
            const result = await response.text
            return { topic: data.topic, queries: result }
        },
    })

    // Step 2: Scrape web data
    .andThen({
        id: 'scrape-data',
        execute: async ({ data, writer }) => {
            voltlogger.info('Step 2: Scraping web data...')
            const response = await scrapperAgent.streamText(
                `Search and scrape relevant data for these queries:\n${data.queries}\n\nTopic: ${data.topic}`
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'scrapper-',
                    agentId: 'scrapper',
                })
            }
            const result = await response.text
            return {
                topic: data.topic,
                queries: data.queries,
                scrapedData: result,
            }
        },
    })

    // Step 3: Analyze data
    .andThen({
        id: 'analyze-data',
        execute: async ({ data, writer }) => {
            voltlogger.info('Step 3: Analyzing data...')
            const response = await dataAnalyzerAgent.streamText(
                `Analyze this scraped data:\n${data.scrapedData}`
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'analyzer-',
                    agentId: 'data-analyzer',
                })
            }
            const result = await response.text
            return {
                topic: data.topic,
                queries: data.queries,
                scrapedData: data.scrapedData,
                analysis: result,
            }
        },
    })

    // Step 4: Fact-check findings
    .andThen({
        id: 'fact-check',
        execute: async ({ data, writer }) => {
            voltlogger.info('Step 4: Fact-checking...')
            const response = await factCheckerAgent.streamText(
                `Fact-check these findings:\n${data.analysis}`
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'factchecker-',
                    agentId: 'fact-checker',
                })
            }
            const result = await response.text
            return {
                topic: data.topic,
                queries: data.queries,
                scrapedData: data.scrapedData,
                analysis: data.analysis,
                factCheck: result,
            }
        },
    })

    // Step 5: Synthesize information
    .andThen({
        id: 'synthesize',
        execute: async ({ data, writer }) => {
            voltlogger.info('Step 5: Synthesizing information...')
            const response = await synthesizerAgent.streamText(
                `Synthesize this fact-checked analysis:\n${data.factCheck}`
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'synthesizer-',
                    agentId: 'synthesizer',
                })
            }
            const result = await response.text
            return {
                topic: data.topic,
                queries: data.queries,
                scrapedData: data.scrapedData,
                analysis: data.analysis,
                factCheck: data.factCheck,
                synthesis: result,
            }
        },
    })

    // Step 6: Write final report
    .andThen({
        id: 'write-report',
        execute: async ({ data, writer }) => {
            voltlogger.info('Step 6: Writing final report...')
            const response = await writerAgent.streamText(
                `Write a comprehensive research report based on:\n${data.synthesis}`
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'writer-',
                    agentId: 'writer',
                })
            }
            const result = await response.text
            return {
                topic: data.topic,
                queries: data.queries,
                scrapedData: data.scrapedData,
                analysis: data.analysis,
                factCheck: data.factCheck,
                synthesis: data.synthesis,
                finalReport: result,
            }
        },
    })

    // Step 7: Assemble final result
    .andThen({
        id: 'finalize',
        execute: async ({ data }) => {
            await Promise.resolve()
            voltlogger.info('=== Research workflow complete ===')

            return {
                topic: data.topic,
                queries: data.queries ?? '',
                scrapedData: data.scrapedData ?? '',
                analysis: data.analysis ?? '',
                factCheck: data.factCheck ?? '',
                synthesis: data.synthesis ?? '',
                finalReport: data.finalReport ?? '',
            }
        },
    })
