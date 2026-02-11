import { Agent, messageHelpers } from '@voltagent/core'

import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import {
    analyzeDataTool,
    extractInsightsTool,
} from '../tools/analyze-data-tool.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import { dataAnalyzerPrompt } from './prompts.js'
import { financialAnalysisToolkit } from '../tools/financial-analysis-toolkit.js'

export const dataAnalyzerAgent = new Agent({
    id: 'data-analyzer',
    name: 'Data Analyzer',
    purpose:
        'Analyze research data, extract patterns and insights, and provide data-driven conclusions',
    model: ({ context }) => {
        const provider = (context.get('provider') as string) || 'google'
        const model =
            (context.get('model') as string) ||
            'gemini-2.5-flash-lite-preview-09-2025'
        return `${provider}/${model}`
    },
    instructions: dataAnalyzerPrompt({
        dataType: 'research data',
        focus: 'patterns and insights',
        confidence: 'high',
        format: 'structured markdown',
        standards:
            'Use evidence-based conclusions, quantify findings where possible',
        task: 'Analyze the provided data and extract key insights',
    }),
    tools: [analyzeDataTool, extractInsightsTool],
    toolkits: [thinkOnlyToolkit, financialAnalysisToolkit],
    toolRouting: {
        embedding: {
            model: 'google/text-embedding-004',
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
            voltlogger.info(`[${opId}] DataAnalyzer starting`)
            await Promise.resolve()
        },
        onToolStart: async ({ tool, context }) => {
            const opId = context.context.get('opId') as string
            voltlogger.info(`[${opId}] tool: ${String(tool.name)}`)
            await Promise.resolve()
        },
        onToolEnd: async ({ tool, error, context }) => {
            const opId = context.context.get('opId') as string
            if (error) {
                voltlogger.error(`[${opId}] tool ${String(tool.name)} failed`)
            }
            await Promise.resolve()
            // Return undefined explicitly to satisfy the hook's expected return type
            return undefined
        },
        onEnd: async ({ output, error, context }) => {
            const opId = context.context.get('opId') as string
            if (error) {
                voltlogger.error(
                    `[${opId}] DataAnalyzer error: ${error.message}`
                )
            } else if (output) {
                voltlogger.info(`[${opId}] DataAnalyzer completed`)
            }
            await Promise.resolve()
        },
        onPrepareMessages: async ({ messages }) => {
            // Add timestamp to all user messages for audit trail
            const timestamp = new Date().toISOString()
            const enhancedMessages = messages.map((msg) =>
                messageHelpers.addTimestampToMessage(msg, timestamp)
            )

            // Log message content summary for observability
            const userMsgs = enhancedMessages.filter(
                (m) => messageHelpers.hasTextPart(m) && m.role === 'user'
            )
            if (userMsgs.length > 0) {
                const totalLength = userMsgs.reduce(
                    (sum, m) => sum + messageHelpers.getContentLength(m),
                    0
                )
                voltlogger.info(
                    `[DataAnalyzer] Processing ${userMsgs.length} user messages, ${totalLength} chars`
                )
            }

            await Promise.resolve()
            return { messages: enhancedMessages }
        },
    },
    temperature: 0.3, // Lower temperature for more consistent analysis
    maxOutputTokens: 64000,
    maxSteps: 25,
    markdown: true,
    logger: voltlogger,
    observability: voltObservability,
    inputGuardrails: [],
    outputGuardrails: [],
})
