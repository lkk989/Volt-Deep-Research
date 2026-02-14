import { NodeFilesystemBackend, PlanAgent } from '@voltagent/core'
import { google } from '@ai-sdk/google'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { chromaRetriever } from '../retriever/chroma.js'
import {
    hackernewsTopStoriesTool,
    hackernewsSearchTool,
    redditNewsTool,
    devtoArticlesTool,
    githubTrendingTool,
    multiSourceNewsTool,
    newsSearchTool,
    trendingTopicsTool,
} from '../tools/news-aggregator-toolkit.js'
import {
    analyzeNewsSentimentTool,
    analyzeSocialSentimentTool,
    marketSentimentTool,
    compareSentimentTool,
} from '../tools/sentiment-analysis-toolkit.js'
import {
    sharedWorkspaceRuntime,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { defaultAgentHooks } from './agentHooks.js'
import { dataAnalyzerAgent } from './data-analyzer.agent.js'
import { dataScientistAgent } from './data-scientist.agent.js'

const newsPlanInstructions = [
    'You are a News & Trends Orchestrator PlanAgent. Your mission is to monitor, aggregate, and analyze news from multiple sources in real-time.',
    '',
    '## Core Responsibilities',
    '- Aggregate news from HackerNews, Reddit, Dev.to, and GitHub Trending',
    '- Analyze sentiment across topics, markets, and assets',
    '- Detect emerging trends and breaking news',
    '- Provide comprehensive market sentiment analysis',
    '- Monitor specific assets (stocks, crypto, forex) for sentiment shifts',
    '',
    '## News Categories',
    '- Technology: HackerNews, programming subreddits, Dev.to',
    '- Business: Business subreddits, HN Show HN, finance communities',
    '- Crypto: CryptoCurrency subreddit, blockchain discussions',
    '- Stocks: Investing subreddits, market discussions',
    '- AI/ML: MachineLearning subreddit, AI tag on Dev.to',
    '- Startups: Startup subreddits, Show HN posts',
    '',
    '## Workflow',
    '1. **Topic Selection**: Identify the news category or asset to monitor',
    '2. **Aggregation**: Use news tools to gather stories from multiple sources',
    '3. **Sentiment Analysis**: Analyze sentiment of collected news',
    '4. **Trend Detection**: Identify trending topics and emerging patterns',
    '5. **Reporting**: Summarize findings with sentiment scores and key themes',
    '',
    '## Available Tools',
    '- HackerNews tools: Top stories, search',
    '- Reddit tools: Subreddit news',
    '- Dev.to: Article aggregation',
    '- GitHub Trending: Popular repositories',
    '- Sentiment tools: News, social, market sentiment analysis',
    '- Comparison tools: Cross-topic sentiment comparison',
    '',
    '## Analysis Standards',
    '- Always aggregate from at least 2 sources for coverage',
    '- Provide sentiment scores with confidence levels',
    '- Track engagement metrics (upvotes, comments, shares)',
    '- Identify key themes and discussion topics',
    '- Flag breaking news or significant sentiment shifts',
].join('\n')

export const newsPlanAgent = new PlanAgent({
    id: 'news-orchestrator',
    name: 'News & Trends Orchestrator',
    purpose:
        'Monitor and analyze news and trends from multiple free sources. Aggregates HackerNews, Reddit, Dev.to, and GitHub with sentiment analysis and trend detection.',
    systemPrompt: newsPlanInstructions,

    model: [
        {
            id: 'primary',
            model: google('gemini-2.5-flash-lite-preview-09-2025'),
            maxRetries: 3,
        },
        {
            id: 'secondary',
            model: google('gemini-2.0-flash-exp'),
            maxRetries: 2,
        },
    ],

    tools: [
        hackernewsTopStoriesTool,
        hackernewsSearchTool,
        redditNewsTool,
        devtoArticlesTool,
        githubTrendingTool,
        multiSourceNewsTool,
        newsSearchTool,
        trendingTopicsTool,
        analyzeNewsSentimentTool,
        analyzeSocialSentimentTool,
        marketSentimentTool,
        compareSentimentTool,
    ],

    toolkits: [sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit],

    toolRouting: {
        embedding: {
            model: 'google/gemini-embedding-001',
            normalize: true,
            maxBatchSize: 200,
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
    maxSteps: 50,
    logger: voltlogger,
    maxOutputTokens: 64000,
    observability: voltObservability,

    hooks: {
        ...defaultAgentHooks,
        onStart: async ({ agent, context }) => {
            voltlogger.info(
                `[News PlanAgent] Starting news monitoring operation`,
                {
                    agent: agent.name,
                    operationId: context.operationId,
                }
            )
        },
        onRetry: async (args) => {
            if (args.source === 'llm') {
                voltlogger.warn(
                    `[News PlanAgent] LLM retry ${args.nextAttempt}/${args.maxRetries + 1}`,
                    { model: args.modelName }
                )
            }
        },
        onFallback: async ({ stage, fromModel, nextModel, operation }) => {
            voltlogger.warn(
                `[News PlanAgent] Fallback (${stage}) from ${fromModel} to ${nextModel ?? 'next'}`,
                { operation }
            )
        },
    },

    retriever: chromaRetriever,

    subagents: [dataAnalyzerAgent, dataScientistAgent],

    generalPurposeAgent: true,

    task: {
        systemPrompt:
            'You are a news monitoring task manager. Gather news from multiple sources, analyze sentiment, and identify trends.',
        taskDescription:
            'Execute news aggregation and sentiment analysis tasks across multiple free sources.',
        maxSteps: 50,
        supervisorConfig: {
            includeAgentsMemory: true,
            fullStreamEventForwarding: {
                types: [
                    'tool-call',
                    'tool-result',
                    'text-delta',
                    'start-step',
                    'finish-step',
                ],
            },
        },
    },

    summarization: {
        triggerTokens: 80000,
        keepMessages: 6,
        maxOutputTokens: 4000,
        systemPrompt:
            'Summarize the news monitoring session, highlighting key stories, sentiment trends, and important developments.',
        enabled: true,
        model: 'google/gemini-2.0-flash-exp',
    },

    filesystem: {
        backend: new NodeFilesystemBackend({
            rootDir: sharedWorkspaceRuntime.filesystemRootDir,
            virtualMode: true,
            maxFileSizeMb: 25,
        }),
        systemPrompt:
            'Use the filesystem to store news articles, sentiment data, and trend analysis results.',
        customToolDescriptions: {
            lsInfo: 'List files in news workspace',
            read: 'Read saved news or sentiment data',
            write: 'Save news aggregation or analysis results',
            edit: 'Update news records with new information',
        },
        toolTokenLimitBeforeEvict: 12000,
    },

    toolResultEviction: {
        enabled: true,
        tokenLimit: 12000,
    },
})
