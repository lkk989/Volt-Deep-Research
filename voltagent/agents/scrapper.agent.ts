import { Agent } from '@voltagent/core'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { apiIntegrationToolkit } from '../tools/api-integration-toolkit.js'
import { dataConversionToolkit } from '../tools/data-conversion-toolkit.js'
import {
    pdfExtractLinksTool,
    pdfExtractTextTool,
    pdfGetMetadataTool,
    pdfGetOutlineTool,
} from '../tools/pdf-toolkit.js'
import { webScraperToolkit } from '../tools/web-scraper-toolkit.js'
import {
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { scrapperPrompt } from './prompts.js'

export const scrapperAgent = new Agent({
    id: 'scrapper',
    name: 'Scrapper',
    purpose:
        'Collect high-quality, structured evidence from web/API sources with provenance metadata and extraction reliability signals.',
    model: ({ context }) => {
        const provider = (context.get('provider') as string) || 'google'
        const model =
            (context.get('model') as string) ||
            'gemini-2.5-flash-lite-preview-09-2025'
        return `${provider}/${model}`
    },
    instructions: scrapperPrompt({
        sources: 'web pages, APIs, structured data',
        format: 'markdown, structured data, clean text',
        ethics: 'respect robots.txt, rate limiting, terms of service',
        errorHandling: 'graceful failures, retry logic, timeout handling',
        tools: 'web-scraper toolkit, API integration toolkit, data conversion toolkit, workspace retrieval',
        standards:
            'Data quality over quantity, ethical practices, reproducible extraction, and provenance-first output',
        task: 'Extract and normalize web evidence with source metadata and concise excerpts.',
    }),
    tools: [
        pdfExtractTextTool,
        pdfGetMetadataTool,
        pdfExtractLinksTool,
        pdfGetOutlineTool,
    ],
    toolkits: [
        webScraperToolkit,
        apiIntegrationToolkit,
        dataConversionToolkit,
        sharedWorkspaceSearchToolkit,
        sharedWorkspaceSkillsToolkit,
    ],
    toolRouting: {
        embedding: {
            model: 'google/gemini-embedding-001',
            normalize: true,
            topK: 3,
            toolText: (tool) => {
                const tags = tool.tags?.join(', ') ?? ''
                return [tool.name, tool.description, tags]
                    .filter(Boolean)
                    .join('\n')
            },
        },
    },
    memory: sharedMemory,
    retriever: undefined,
    subAgents: [],
    supervisorConfig: undefined,
    maxHistoryEntries: 100,
    hooks: {
        onStart: async ({ context }) => {
            const opId = crypto.randomUUID()
            context.context.set('opId', opId)
            voltlogger.info(`[${opId}] Scrapper starting`)
            await Promise.resolve()
        },
        onToolStart: async ({ tool, context }) => {
            const opId = context.context.get('opId') as string
            voltlogger.info(`[${opId}] tool: ${tool.name}`)
            await Promise.resolve()
        },
        onToolEnd: async ({ tool, error, context }) => {
            const opId = context.context.get('opId') as string
            if (error) {
                voltlogger.error(`[${opId}] tool ${tool.name} failed`)
            }
            await Promise.resolve()
        },
        onEnd: async ({ output, error, context }) => {
            const opId = context.context.get('opId') as string
            if (error) {
                voltlogger.error(`[${opId}] Scrapper error: ${error.message}`)
            } else if (output) {
                voltlogger.info(`[${opId}] Scrapper completed`)
            }
            await Promise.resolve()
        },
        onPrepareMessages: async ({ messages, context }) => {
            const opId = context?.context.get('opId') as string | undefined
            voltlogger.debug(`[${opId ?? 'unknown-op'}] preparing messages`, {
                count: messages.length,
            })
            await Promise.resolve()
            return { messages }
        },
    },
    temperature: 0.3,
    maxOutputTokens: 64000,
    maxSteps: 25,
    markdown: false,
    logger: voltlogger,
    observability: voltObservability,
    inputGuardrails: [],
    outputGuardrails: [],
})
