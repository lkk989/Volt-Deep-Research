import { Agent, createHooks } from '@voltagent/core'

import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
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
import { dataConversionToolkit } from '../tools/data-conversion-toolkit.js'
import { dataProcessingToolkit } from '../tools/data-processing-toolkit.js'
import {
  economicCategorySeriesTool,
  economicIndicatorTool,
  economicReleasesTool,
  economicSearchTool,
  worldBankCountriesTool,
  worldBankIndicatorsListTool,
  worldBankIndicatorTool,
} from '../tools/economic-data-toolkit.js'
import {
  forexConversionTool,
  forexCurrenciesListTool,
  forexHistoricalRateTool,
  forexLatestBaseTool,
  forexMultiSourceRateTool,
  forexSpotRateTool,
  forexTimeSeriesTool,
} from '../tools/forex-market-toolkit.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import {
  calculateBollingerBandsTool,
  calculateEmaTool,
  calculateMacdTool,
  calculateRsiTool,
  calculateSmaTool,
  correlationAnalysisTool,
  descriptiveStatsTool,
  hypothesisTestTool,
  kMeansClusteringTool,
  linearRegressionTool,
  zScoreAnalysisTool,
} from '../tools/statistical-analysis-toolkit.js'
import {
  stockBatchQuoteTool,
  stockMultiSourcePriceTool,
  stockOhlcvTool,
  stockSpotPriceTool,
  stockStooqDailyTool,
  stockSymbolSearchTool,
} from '../tools/stock-market-toolkit.js'
import { visualizationToolkit } from '../tools/visualization-toolkit.js'
import {
  sharedWorkspaceFilesystemToolkit,
  sharedWorkspaceSearchToolkit,
  sharedWorkspaceSkillsToolkit
} from '../workspaces/index.js'
import { dataScientistPrompt } from './prompts.js'

const dataScientistHooks = createHooks({
  onStart: ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set('operationId', opId)
    context.context.set('startTime', new Date().toISOString())
    context.context.set('toolExecutions', [])
    voltlogger.info(`[${opId}] Data Scientist starting`, {
      agent: agent.name,
    })
  },
  onToolStart: ({ tool, context, args: toolArgs }) => {
    const opId = context.context.get('operationId') as string
    const toolStart = new Date().toISOString()
    context.context.set(`tool_${tool.name}_start`, toolStart)
    voltlogger.info(`[${opId}] Tool starting: ${tool.name}`, {
      toolArgs: JSON.stringify(toolArgs),
    })
  },
  onToolEnd: ({ tool, error, context }) => {
    const opId = context.context.get('operationId') as string
    const toolStart = context.context.get(
      `tool_${tool.name}_start`
    ) as string
    const duration = toolStart
      ? new Date().getTime() - new Date(toolStart).getTime()
      : 0
    const executions =
      (context.context.get('toolExecutions') as unknown[]) || []
    executions.push({
      tool: tool.name,
      duration,
      success: !error,
      timestamp: new Date().toISOString(),
    })
    context.context.set('toolExecutions', executions)
    if (error) {
      voltlogger.error(
        `[${opId}] Tool failed: ${tool.name} (${duration}ms)`,
        { error }
      )
    } else {
      voltlogger.info(
        `[${opId}] Tool completed: ${tool.name} (${duration}ms)`
      )
    }
    return undefined
  },
  onEnd: ({ context }) => {
    const opId = context.context.get('operationId') as string
    const startTime = context.context.get('startTime') as string
    const duration = new Date().getTime() - new Date(startTime).getTime()
    const executions = context.context.get('toolExecutions')
    voltlogger.info(`[${opId}] Data Scientist completed in ${duration}ms`, {
      toolExecutions: executions,
    })
  },
})

export const dataScientistAgent = new Agent({
  id: 'data-scientist',
  name: 'Data Scientist',
  purpose:
    'Run statistically rigorous analysis, quantify uncertainty, and deliver hypothesis-driven recommendations with explicit assumptions.',
  model: ({ context }) => {
    const provider = (context.get('provider') as string) || 'google'
    const model =
      (context.get('model') as string) ||
      'gemini-2.5-flash-lite-preview-09-2025'
    return `${provider}/${model}`
  },
  instructions: ({ context }) => {
    const analysisType = String(
      context?.get('analysisType') ?? 'exploratory'
    )
    return dataScientistPrompt({
      analysisType,
      datasetContext:
        'research datasets and extracted evidence artifacts',
      goal:
        analysisType === 'predictive'
          ? 'deliver robust forecasts'
          : analysisType === 'causal'
            ? 'estimate causal effects'
            : 'extract reliable insights',
      tools: 'data processing, data conversion, stock market data, crypto market data, visualization, workspace search/skills, reasoning',
      standards:
        'State assumptions, quantify uncertainty, report effect sizes, and avoid causal overreach unless supported.',
      task: 'Perform statistically sound analysis and return prioritized findings with confidence and limitations.',
    })
  },
  tools: [
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
    forexSpotRateTool,
    forexMultiSourceRateTool,
    forexConversionTool,
    forexHistoricalRateTool,
    forexTimeSeriesTool,
    forexCurrenciesListTool,
    forexLatestBaseTool,
    economicIndicatorTool,
    economicSearchTool,
    worldBankIndicatorTool,
    worldBankCountriesTool,
    worldBankIndicatorsListTool,
    economicReleasesTool,
    economicCategorySeriesTool,
  ],
  toolkits: [
    thinkOnlyToolkit,
    dataConversionToolkit,
    dataProcessingToolkit,
    visualizationToolkit,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
  ],
  workspace: sharedWorkspaceFilesystemToolkit,
  workspaceToolkits: {},
  workspaceSkillsPrompt: true,
  toolRouting: {
    embedding: {
      model: 'google/gemini-embedding-001',
      topK: 5,
      toolText: (tool) => {
        const tags = tool.tags?.join(', ') ?? ''
        return [tool.name, tool.description, tags]
          .filter(Boolean)
          .join('\n')
      },
    },
  },
  memory: sharedMemory,
  maxHistoryEntries: 100,
  temperature: 0.2,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  hooks: dataScientistHooks,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
})
