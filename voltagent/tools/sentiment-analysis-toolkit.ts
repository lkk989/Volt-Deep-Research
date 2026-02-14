import axios, { type AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import {
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

const requestOptionsSchema = z
    .object({
        timeoutMs: z.number().int().min(1000).max(60000).default(15000),
        retries: z.number().int().min(0).max(8).default(3),
        retryDelayMs: z.number().int().min(100).max(10000).default(700),
    })
    .default({ timeoutMs: 15000, retries: 3, retryDelayMs: 700 })

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const hooksFor = (name: string) => ({
    onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
        voltlogger.info(`${name}: start`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
            args,
        })
    },
    onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
        if (error) {
            voltlogger.error(`${name}: error`, {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                error: error instanceof Error ? error.message : String(error),
            })
            return undefined
        }
        voltlogger.info(`${name}: end`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
        })
        return undefined
    },
})

const buildHttpClient = (options: z.infer<typeof requestOptionsSchema>) => {
    const client = axios.create({
        timeout: options.timeoutMs,
        headers: {
            'User-Agent': 'mastervolt-sentiment-tools/1.0',
            Accept: 'application/json, text/plain, */*',
        },
    })

    axiosRetry(client, {
        retries: options.retries,
        retryDelay: () => options.retryDelayMs,
        retryCondition: (error) => {
            const status = error.response?.status
            if (status === 429) return true
            if (status !== undefined && status >= 500) return true
            return axiosRetry.isNetworkOrIdempotentRequestError(error)
        },
    })

    return client
}

// Simple keyword-based sentiment analysis
const analyzeSentiment = (
    text: string
): { score: number; label: string; confidence: number } => {
    const positiveWords = [
        'bullish',
        'bull',
        'moon',
        'rocket',
        'gain',
        'profit',
        'surge',
        'rally',
        'breakout',
        'pump',
        'green',
        'up',
        'rise',
        'rising',
        'soar',
        'soaring',
        'boost',
        'strong',
        'optimistic',
        'positive',
        'growth',
        'success',
        'win',
        'winning',
        ' ATH ',
        'high',
        'support',
        'accumulation',
        'buy',
        'long',
        'hodl',
        'hold',
        'accumulate',
        'adoption',
        'partnership',
        'launch',
        'upgrade',
        'innovation',
        'milestone',
        'achievement',
    ]

    const negativeWords = [
        'bearish',
        'bear',
        'dump',
        'crash',
        'crash',
        'fall',
        'falling',
        'drop',
        'dropping',
        'plunge',
        'plunging',
        'decline',
        'declining',
        'red',
        'down',
        'loss',
        'losses',
        'panic',
        'fear',
        'fud',
        'scam',
        'rug',
        'rugpull',
        'hack',
        'exploit',
        'vulnerability',
        'ban',
        'illegal',
        'investigation',
        'lawsuit',
        'fine',
        'penalty',
        'shutdown',
        'liquidation',
        'liquidated',
        'margin call',
        'bankruptcy',
        'insolvent',
        'fraud',
    ]

    const lowerText = text.toLowerCase()
    let positiveCount = 0
    let negativeCount = 0

    positiveWords.forEach((word) => {
        const regex = new RegExp(word, 'g')
        const matches = lowerText.match(regex)
        if (matches) positiveCount += matches.length
    })

    negativeWords.forEach((word) => {
        const regex = new RegExp(word, 'g')
        const matches = lowerText.match(regex)
        if (matches) negativeCount += matches.length
    })

    const totalWords = lowerText.split(/\s+/).length
    const sentimentWords = positiveCount + negativeCount

    if (sentimentWords === 0) {
        return { score: 0, label: 'neutral', confidence: 0.5 }
    }

    const score = (positiveCount - negativeCount) / sentimentWords
    const normalizedScore = Math.max(-1, Math.min(1, score))

    let label: string
    if (normalizedScore > 0.2) label = 'positive'
    else if (normalizedScore < -0.2) label = 'negative'
    else label = 'neutral'

    const confidence = Math.min(1, sentimentWords / 5)

    return { score: normalizedScore, label, confidence }
}

export const analyzeNewsSentimentTool = createTool({
    name: 'analyze_news_sentiment',
    description:
        'Analyze sentiment of news articles from multiple sources. Aggregates sentiment from HackerNews, Reddit, and Dev.to discussions. No API keys required.',
    tags: ['sentiment', 'news', 'analysis', 'no-api-key'],
    parameters: z.object({
        topic: z
            .string()
            .min(1)
            .max(200)
            .describe('Topic or keyword to analyze'),
        sources: z
            .array(z.enum(['hackernews', 'reddit', 'devto']))
            .default(['hackernews', 'reddit']),
        limit: z.number().int().min(5).max(100).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        overallSentiment: z.object({
            score: z.number(),
            label: z.string(),
            confidence: z.number(),
        }),
        sourceBreakdown: z.array(
            z.object({
                source: z.string(),
                positive: z.number(),
                negative: z.number(),
                neutral: z.number(),
                averageScore: z.number(),
            })
        ),
        sampleArticles: z.array(
            z.object({
                title: z.string(),
                sentiment: z.string(),
                score: z.number(),
                source: z.string(),
            })
        ),
        topic: z.string(),
        timestamp: z.string(),
    }),
    hooks: hooksFor('analyze_news_sentiment'),
    execute: async ({ topic, sources, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const allArticles: any[] = []
        const sourceBreakdown: Record<
            string,
            {
                positive: number
                negative: number
                neutral: number
                scores: number[]
            }
        > = {}

        // Fetch from HackerNews
        if (sources.includes('hackernews')) {
            try {
                const { data } = await client.get(
                    'https://hn.algolia.com/api/v1/search',
                    {
                        params: {
                            query: topic,
                            hitsPerPage: Math.ceil(limit / 2),
                        },
                        signal: context?.abortController?.signal,
                    }
                )

                sourceBreakdown['HackerNews'] = {
                    positive: 0,
                    negative: 0,
                    neutral: 0,
                    scores: [],
                }

                data.hits?.forEach((hit: any) => {
                    const text = `${hit.title} ${hit.story_text || ''}`
                    const sentiment = analyzeSentiment(text)

                    allArticles.push({
                        title: hit.title,
                        sentiment: sentiment.label,
                        score: sentiment.score,
                        source: 'HackerNews',
                        url: hit.url,
                    })

                    sourceBreakdown['HackerNews'][
                        sentiment.label as 'positive' | 'negative' | 'neutral'
                    ]++
                    sourceBreakdown['HackerNews'].scores.push(sentiment.score)
                })
            } catch (error) {
                voltlogger.warn('Failed to fetch HackerNews for sentiment', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Fetch from Reddit
        if (sources.includes('reddit')) {
            try {
                const searchSubs = [
                    'technology',
                    'business',
                    'investing',
                    'CryptoCurrency',
                ]
                const subreddit = searchSubs[0]

                const { data } = await client.get(
                    `https://www.reddit.com/r/${subreddit}/hot.json`,
                    {
                        params: { limit: limit },
                        signal: context?.abortController?.signal,
                    }
                )

                sourceBreakdown['Reddit'] = {
                    positive: 0,
                    negative: 0,
                    neutral: 0,
                    scores: [],
                }

                const filteredPosts = data.data?.children
                    ?.filter(
                        (child: any) =>
                            child.data.title
                                .toLowerCase()
                                .includes(topic.toLowerCase()) ||
                            (child.data.selftext &&
                                child.data.selftext
                                    .toLowerCase()
                                    .includes(topic.toLowerCase()))
                    )
                    .slice(0, Math.ceil(limit / 2))

                filteredPosts?.forEach((child: any) => {
                    const text = `${child.data.title} ${child.data.selftext || ''}`
                    const sentiment = analyzeSentiment(text)

                    allArticles.push({
                        title: child.data.title,
                        sentiment: sentiment.label,
                        score: sentiment.score,
                        source: 'Reddit',
                        url: child.data.url,
                    })

                    sourceBreakdown['Reddit'][
                        sentiment.label as 'positive' | 'negative' | 'neutral'
                    ]++
                    sourceBreakdown['Reddit'].scores.push(sentiment.score)
                })
            } catch (error) {
                voltlogger.warn('Failed to fetch Reddit for sentiment', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Fetch from Dev.to
        if (sources.includes('devto')) {
            try {
                const { data } = await client.get(
                    'https://dev.to/api/articles',
                    {
                        params: { per_page: limit },
                        signal: context?.abortController?.signal,
                    }
                )

                sourceBreakdown['Dev.to'] = {
                    positive: 0,
                    negative: 0,
                    neutral: 0,
                    scores: [],
                }

                const filteredArticles = data
                    .filter(
                        (article: any) =>
                            article.title
                                .toLowerCase()
                                .includes(topic.toLowerCase()) ||
                            (article.description &&
                                article.description
                                    .toLowerCase()
                                    .includes(topic.toLowerCase()))
                    )
                    .slice(0, Math.ceil(limit / 2))

                filteredArticles.forEach((article: any) => {
                    const text = `${article.title} ${article.description || ''}`
                    const sentiment = analyzeSentiment(text)

                    allArticles.push({
                        title: article.title,
                        sentiment: sentiment.label,
                        score: sentiment.score,
                        source: 'Dev.to',
                        url: article.url,
                    })

                    sourceBreakdown['Dev.to'][
                        sentiment.label as 'positive' | 'negative' | 'neutral'
                    ]++
                    sourceBreakdown['Dev.to'].scores.push(sentiment.score)
                })
            } catch (error) {
                voltlogger.warn('Failed to fetch Dev.to for sentiment', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Calculate overall sentiment
        const allScores = allArticles.map((a) => a.score)
        const avgScore =
            allScores.length > 0
                ? allScores.reduce((a, b) => a + b, 0) / allScores.length
                : 0

        let overallLabel: string
        if (avgScore > 0.2) overallLabel = 'positive'
        else if (avgScore < -0.2) overallLabel = 'negative'
        else overallLabel = 'neutral'

        // Format source breakdown
        const formattedSourceBreakdown = Object.entries(sourceBreakdown).map(
            ([source, data]) => ({
                source,
                positive: data.positive,
                negative: data.negative,
                neutral: data.neutral,
                averageScore:
                    data.scores.length > 0
                        ? data.scores.reduce((a, b) => a + b, 0) /
                          data.scores.length
                        : 0,
            })
        )

        return {
            overallSentiment: {
                score: avgScore,
                label: overallLabel,
                confidence: Math.min(1, allArticles.length / 20),
            },
            sourceBreakdown: formattedSourceBreakdown,
            sampleArticles: allArticles.slice(0, 10),
            topic,
            timestamp: new Date().toISOString(),
        }
    },
})

export const analyzeSocialSentimentTool = createTool({
    name: 'analyze_social_sentiment',
    description:
        'Analyze sentiment from social media and community discussions. Aggregates sentiment from Reddit comments and HackerNews discussions. No API keys required.',
    tags: ['sentiment', 'social', 'community', 'no-api-key'],
    parameters: z.object({
        topic: z.string().min(1).max(200),
        subreddits: z.array(z.string()).default(['technology', 'business']),
        limit: z.number().int().min(5).max(50).default(25),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        sentiment: z.object({
            score: z.number(),
            label: z.string(),
            confidence: z.number(),
        }),
        engagement: z.object({
            totalComments: z.number(),
            totalScore: z.number(),
            averageScore: z.number(),
        }),
        topPositive: z.array(
            z.object({
                text: z.string(),
                score: z.number(),
                source: z.string(),
            })
        ),
        topNegative: z.array(
            z.object({
                text: z.string(),
                score: z.number(),
                source: z.string(),
            })
        ),
        topic: z.string(),
        timestamp: z.string(),
    }),
    hooks: hooksFor('analyze_social_sentiment'),
    execute: async ({ topic, subreddits, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const sentiments: Array<{
            text: string
            score: number
            source: string
        }> = []
        let totalScore = 0
        let totalComments = 0

        // Analyze Reddit posts
        for (const subreddit of subreddits.slice(0, 3)) {
            try {
                const { data } = await client.get(
                    `https://www.reddit.com/r/${subreddit}/hot.json`,
                    {
                        params: { limit },
                        signal: context?.abortController?.signal,
                    }
                )

                const filteredPosts = data.data?.children
                    ?.filter(
                        (child: any) =>
                            child.data.title
                                .toLowerCase()
                                .includes(topic.toLowerCase()) ||
                            (child.data.selftext &&
                                child.data.selftext
                                    .toLowerCase()
                                    .includes(topic.toLowerCase()))
                    )
                    .slice(0, 10)

                filteredPosts?.forEach((child: any) => {
                    const text = child.data.title
                    const sentiment = analyzeSentiment(text)

                    sentiments.push({
                        text: text.substring(0, 200),
                        score: sentiment.score,
                        source: `Reddit r/${subreddit}`,
                    })

                    totalScore += child.data.score
                    totalComments += child.data.num_comments
                })
            } catch (error) {
                voltlogger.warn(`Failed to fetch Reddit r/${subreddit}`, {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Sort by sentiment score
        const sortedBySentiment = [...sentiments].sort(
            (a, b) => b.score - a.score
        )
        const topPositive = sortedBySentiment
            .filter((s) => s.score > 0)
            .slice(0, 5)
        const topNegative = sortedBySentiment
            .filter((s) => s.score < 0)
            .slice(-5)
            .reverse()

        // Calculate overall
        const avgSentiment =
            sentiments.length > 0
                ? sentiments.reduce((acc, s) => acc + s.score, 0) /
                  sentiments.length
                : 0

        let label: string
        if (avgSentiment > 0.2) label = 'positive'
        else if (avgSentiment < -0.2) label = 'negative'
        else label = 'neutral'

        return {
            sentiment: {
                score: avgSentiment,
                label,
                confidence: Math.min(1, sentiments.length / 10),
            },
            engagement: {
                totalComments,
                totalScore,
                averageScore:
                    sentiments.length > 0 ? totalScore / sentiments.length : 0,
            },
            topPositive,
            topNegative,
            topic,
            timestamp: new Date().toISOString(),
        }
    },
})

export const marketSentimentTool = createTool({
    name: 'market_sentiment',
    description:
        'Analyze market sentiment for stocks, crypto, or forex. Aggregates sentiment from investing subreddits and financial discussions. No API keys required.',
    tags: [
        'sentiment',
        'market',
        'finance',
        'stocks',
        'crypto',
        'forex',
        'no-api-key',
    ],
    parameters: z.object({
        asset: z
            .string()
            .min(1)
            .max(50)
            .describe('Asset symbol or name (e.g., BTC, AAPL, EURUSD)'),
        assetType: z.enum(['crypto', 'stock', 'forex']).default('crypto'),
        limit: z.number().int().min(5).max(100).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        asset: z.string(),
        assetType: z.string(),
        sentiment: z.object({
            score: z.number(),
            label: z.string(),
            bullish: z.number(),
            bearish: z.number(),
            neutral: z.number(),
        }),
        keyThemes: z.array(
            z.object({
                theme: z.string(),
                mentions: z.number(),
                sentiment: z.number(),
            })
        ),
        recentDiscussions: z.array(
            z.object({
                title: z.string(),
                sentiment: z.string(),
                score: z.number(),
                upvotes: z.number(),
                source: z.string(),
            })
        ),
        timestamp: z.string(),
    }),
    hooks: hooksFor('market_sentiment'),
    execute: async ({ asset, assetType, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        // Map asset types to relevant subreddits
        const subredditMap: Record<string, string[]> = {
            crypto: ['CryptoCurrency', 'Bitcoin', 'ethereum', 'CryptoMarkets'],
            stock: ['stocks', 'investing', 'wallstreetbets', 'StockMarket'],
            forex: ['Forex', 'trading', 'investing'],
        }

        const subreddits = subredditMap[assetType] || subredditMap.crypto
        const sentiments: any[] = []
        const themeCounts: Record<
            string,
            { count: number; sentimentSum: number }
        > = {}

        // Fetch from relevant subreddits
        for (const subreddit of subreddits.slice(0, 2)) {
            try {
                const { data } = await client.get(
                    `https://www.reddit.com/r/${subreddit}/hot.json`,
                    {
                        params: { limit: 50 },
                        signal: context?.abortController?.signal,
                    }
                )

                const filteredPosts = data.data?.children
                    ?.filter(
                        (child: any) =>
                            child.data.title
                                .toLowerCase()
                                .includes(asset.toLowerCase()) ||
                            (child.data.selftext &&
                                child.data.selftext
                                    .toLowerCase()
                                    .includes(asset.toLowerCase()))
                    )
                    .slice(0, Math.ceil(limit / 2))

                filteredPosts?.forEach((child: any) => {
                    const text = `${child.data.title} ${child.data.selftext || ''}`
                    const sentiment = analyzeSentiment(text)

                    sentiments.push({
                        title: child.data.title,
                        sentiment: sentiment.label,
                        score: sentiment.score,
                        upvotes: child.data.score,
                        source: `Reddit r/${subreddit}`,
                    })

                    // Extract themes
                    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || []
                    words.forEach((word: string) => {
                        if (
                            ![
                                'this',
                                'that',
                                'with',
                                'from',
                                'have',
                                'been',
                                'they',
                                'their',
                                'what',
                                'when',
                                'where',
                            ].includes(word)
                        ) {
                            if (!themeCounts[word]) {
                                themeCounts[word] = {
                                    count: 0,
                                    sentimentSum: 0,
                                }
                            }
                            themeCounts[word].count++
                            themeCounts[word].sentimentSum += sentiment.score
                        }
                    })
                })
            } catch (error) {
                voltlogger.warn(`Failed to fetch r/${subreddit}`, {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Calculate overall sentiment
        const bullish = sentiments.filter(
            (s) => s.sentiment === 'positive'
        ).length
        const bearish = sentiments.filter(
            (s) => s.sentiment === 'negative'
        ).length
        const neutral = sentiments.filter(
            (s) => s.sentiment === 'neutral'
        ).length
        const total = sentiments.length || 1

        const avgScore =
            sentiments.length > 0
                ? sentiments.reduce((acc, s) => acc + s.score, 0) /
                  sentiments.length
                : 0

        let label: string
        if (avgScore > 0.2) label = 'bullish'
        else if (avgScore < -0.2) label = 'bearish'
        else label = 'neutral'

        // Get top themes
        const keyThemes = Object.entries(themeCounts)
            .filter(([, data]) => data.count >= 2)
            .map(([theme, data]) => ({
                theme,
                mentions: data.count,
                sentiment: data.sentimentSum / data.count,
            }))
            .sort((a, b) => b.mentions - a.mentions)
            .slice(0, 10)

        return {
            asset,
            assetType,
            sentiment: {
                score: avgScore,
                label,
                bullish,
                bearish,
                neutral,
            },
            keyThemes,
            recentDiscussions: sentiments.slice(0, 10),
            timestamp: new Date().toISOString(),
        }
    },
})

export const compareSentimentTool = createTool({
    name: 'compare_sentiment',
    description:
        'Compare sentiment across multiple topics or assets. Useful for competitive analysis or market comparison. No API keys required.',
    tags: ['sentiment', 'comparison', 'analysis', 'no-api-key'],
    parameters: z.object({
        topics: z.array(z.string().min(1).max(100)).min(2).max(5),
        source: z.enum(['hackernews', 'reddit', 'all']).default('all'),
        limit: z.number().int().min(10).max(100).default(50),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        comparisons: z.array(
            z.object({
                topic: z.string(),
                sentiment: z.number(),
                label: z.string(),
                mentionCount: z.number(),
                avgEngagement: z.number(),
            })
        ),
        ranking: z.array(z.string()),
        insights: z.array(z.string()),
        timestamp: z.string(),
    }),
    hooks: hooksFor('compare_sentiment'),
    execute: async ({ topics, source, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const topicData = topics.map((topic) => ({
            topic,
            sentiments: [] as number[],
            mentions: 0,
            engagement: [] as number[],
        }))

        // Fetch from HackerNews if selected
        if (source === 'hackernews' || source === 'all') {
            try {
                const { data: storyIds } = await client.get<number[]>(
                    'https://hacker-news.firebaseio.com/v0/topstories.json',
                    { signal: context?.abortController?.signal }
                )

                const topIds = storyIds.slice(0, 100)
                const stories = await Promise.all(
                    topIds.map(async (id) => {
                        try {
                            const { data } = await client.get(
                                `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
                                { signal: context?.abortController?.signal }
                            )
                            return data
                        } catch {
                            return null
                        }
                    })
                )

                stories
                    .filter((s) => s !== null && s.type === 'story')
                    .forEach((story) => {
                        const text = story.title.toLowerCase()
                        topicData.forEach((td) => {
                            if (text.includes(td.topic.toLowerCase())) {
                                const sentiment = analyzeSentiment(story.title)
                                td.sentiments.push(sentiment.score)
                                td.mentions++
                                td.engagement.push(story.score || 0)
                            }
                        })
                    })
            } catch (error) {
                voltlogger.warn('Failed to fetch HackerNews for comparison', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Fetch from Reddit if selected
        if (source === 'reddit' || source === 'all') {
            try {
                const { data } = await client.get(
                    'https://www.reddit.com/r/technology/hot.json',
                    {
                        params: { limit: 100 },
                        signal: context?.abortController?.signal,
                    }
                )

                data.data?.children?.forEach((child: any) => {
                    const text = child.data.title.toLowerCase()
                    topicData.forEach((td) => {
                        if (text.includes(td.topic.toLowerCase())) {
                            const sentiment = analyzeSentiment(child.data.title)
                            td.sentiments.push(sentiment.score)
                            td.mentions++
                            td.engagement.push(child.data.score || 0)
                        }
                    })
                })
            } catch (error) {
                voltlogger.warn('Failed to fetch Reddit for comparison', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Format comparisons
        const comparisons = topicData.map((td) => {
            const avgSentiment =
                td.sentiments.length > 0
                    ? td.sentiments.reduce((a, b) => a + b, 0) /
                      td.sentiments.length
                    : 0

            let label: string
            if (avgSentiment > 0.2) label = 'positive'
            else if (avgSentiment < -0.2) label = 'negative'
            else label = 'neutral'

            return {
                topic: td.topic,
                sentiment: avgSentiment,
                label,
                mentionCount: td.mentions,
                avgEngagement:
                    td.engagement.length > 0
                        ? td.engagement.reduce((a, b) => a + b, 0) /
                          td.engagement.length
                        : 0,
            }
        })

        // Sort by sentiment score
        const ranking = [...comparisons]
            .sort((a, b) => b.sentiment - a.sentiment)
            .map((c) => c.topic)

        // Generate insights
        const insights: string[] = []
        if (comparisons.length > 1) {
            const top = comparisons.reduce((a, b) =>
                a.sentiment > b.sentiment ? a : b
            )
            const bottom = comparisons.reduce((a, b) =>
                a.sentiment < b.sentiment ? a : b
            )

            insights.push(
                `${top.topic} has the most positive sentiment at ${(top.sentiment * 100).toFixed(1)}%`
            )
            insights.push(
                `${bottom.topic} has the most negative sentiment at ${(bottom.sentiment * 100).toFixed(1)}%`
            )

            const mostMentioned = comparisons.reduce((a, b) =>
                a.mentionCount > b.mentionCount ? a : b
            )
            insights.push(
                `${mostMentioned.topic} is the most discussed with ${mostMentioned.mentionCount} mentions`
            )
        }

        return {
            comparisons,
            ranking,
            insights,
            timestamp: new Date().toISOString(),
        }
    },
})

// Export toolkit
export const sentimentAnalysisToolkit = [
    analyzeNewsSentimentTool,
    analyzeSocialSentimentTool,
    marketSentimentTool,
    compareSentimentTool,
]

export default sentimentAnalysisToolkit
