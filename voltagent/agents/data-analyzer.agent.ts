import { Agent, messageHelpers } from '@voltagent/core'

import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import {
    analyzeDataTool,
    extractInsightsTool,
} from '../tools/analyze-data-tool.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import { alphaVantageToolkit } from '../tools/alpha-vantage-toolkit.js'
import {
    binanceAggTradesTool,
    binanceAveragePriceTool,
    binanceBookTickerTool,
    binanceExchangeInfoTool,
    binanceOrderBookTool,
    binanceRecentTradesTool,
    binanceTicker24hrTool,
    cryptoDexBoostsTool,
    cryptoDexPairTool,
    cryptoDexSearchTool,
    cryptoDexTokenPairsTool,
    cryptoDexTokenProfilesTool,
    cryptoMultiSourcePriceTool,
    cryptoOhlcvTool,
    cryptoSpotPriceTool,
} from '../tools/crypto-market-toolkit'
import {
    stockBatchQuoteTool,
    stockMultiSourcePriceTool,
    stockOhlcvTool,
    stockSpotPriceTool,
    stockStooqDailyTool,
    stockSymbolSearchTool,
} from '../tools/stock-market-toolkit.js'
import { sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from '../workspaces/index.js'
import { dataAnalyzerPrompt } from './prompts.js'
import { financialAnalysisToolkit } from '../tools/financial-analysis-toolkit.js'
import { visualizationToolkit } from '../tools/visualization-toolkit.js'

export const dataAnalyzerAgent = new Agent({
    id: 'data-analyzer',
    name: 'Data Analyzer',
    purpose:
        'Extract robust patterns, quantify evidence strength, and produce decision-relevant analytical findings for synthesis.',
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
        tools: 'analyze/extract tools, stock market tools, crypto market tools, alpha-vantage, financial analysis, visualization, workspace retrieval',
        standards:
            'Use evidence-based conclusions, quantify findings, report uncertainty, and distinguish signal from noise.',
        task: 'Analyze provided data, rank findings by impact/confidence, and surface limitations.',
    }),
    tools: [
        analyzeDataTool,
        extractInsightsTool,
        cryptoSpotPriceTool,
        cryptoMultiSourcePriceTool,
        cryptoOhlcvTool,
        binanceExchangeInfoTool,
        binanceTicker24hrTool,
        binanceBookTickerTool,
        binanceAveragePriceTool,
        binanceOrderBookTool,
        binanceRecentTradesTool,
        binanceAggTradesTool,
        cryptoDexSearchTool,
        cryptoDexPairTool,
        cryptoDexTokenPairsTool,
        cryptoDexTokenProfilesTool,
        cryptoDexBoostsTool,
        stockSpotPriceTool,
        stockBatchQuoteTool,
        stockOhlcvTool,
        stockStooqDailyTool,
        stockMultiSourcePriceTool,
        stockSymbolSearchTool,
    ],
    toolkits: [
        thinkOnlyToolkit,
        alphaVantageToolkit,
        financialAnalysisToolkit,
        visualizationToolkit,
        sharedWorkspaceSearchToolkit,
        sharedWorkspaceSkillsToolkit,
    ],
    toolRouting: {
        embedding: {
            model: 'google/gemini-embedding-001',
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
