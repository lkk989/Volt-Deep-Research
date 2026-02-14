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

const newsCategorySchema = z.enum([
    'technology',
    'business',
    'science',
    'ai',
    'programming',
    'startups',
    'crypto',
    'stocks',
    'forex',
    'world',
    'general',
])

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
            'User-Agent': 'mastervolt-news-tools/1.0',
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

export const hackernewsTopStoriesTool = createTool({
    name: 'hackernews_top_stories',
    description:
        'Get top stories from HackerNews. No API key required. Returns trending tech/startup/business news with discussion counts.',
    tags: ['news', 'hackernews', 'technology', 'startups', 'no-api-key'],
    parameters: z.object({
        limit: z.number().int().min(1).max(100).default(30),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        stories: z.array(
            z.object({
                id: z.number(),
                title: z.string(),
                url: z.string().optional(),
                score: z.number(),
                by: z.string(),
                time: z.number(),
                descendants: z.number().optional(),
                type: z.string(),
            })
        ),
        count: z.number(),
        source: z.string(),
    }),
    hooks: hooksFor('hackernews_top_stories'),
    execute: async ({ limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data: storyIds } = await client.get<number[]>(
            'https://hacker-news.firebaseio.com/v0/topstories.json',
            { signal: context?.abortController?.signal }
        )

        const topIds = storyIds.slice(0, limit)
        const stories = await Promise.all(
            topIds.map(async (id) => {
                try {
                    const { data } = await client.get(
                        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
                        { signal: context?.abortController?.signal }
                    )
                    return data
                } catch (error) {
                    voltlogger.warn(`Failed to fetch HN story ${id}`, {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                    return null
                }
            })
        )

        return {
            stories: stories.filter((s) => s !== null && s.type === 'story'),
            count: stories.filter((s) => s !== null && s.type === 'story')
                .length,
            source: 'HackerNews',
        }
    },
})

export const hackernewsSearchTool = createTool({
    name: 'hackernews_search',
    description:
        'Search HackerNews stories by keyword using Algolia API. No API key required. Searches titles and text.',
    tags: ['news', 'hackernews', 'search', 'no-api-key'],
    parameters: z.object({
        query: z.string().min(1).max(200),
        limit: z.number().int().min(1).max(50).default(20),
        sortBy: z.enum(['relevance', 'date']).default('relevance'),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        hits: z.array(
            z.object({
                objectID: z.string(),
                title: z.string(),
                url: z.string().optional(),
                author: z.string(),
                points: z.number(),
                num_comments: z.number(),
                created_at: z.string(),
                _tags: z.array(z.string()),
            })
        ),
        count: z.number(),
        query: z.string(),
        source: z.string(),
    }),
    hooks: hooksFor('hackernews_search'),
    execute: async ({ query, limit, sortBy, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const sortParam = sortBy === 'date' ? 'search_by_date' : 'search'
        const { data } = await client.get(
            `https://hn.algolia.com/api/v1/${sortParam}`,
            {
                params: {
                    query,
                    hitsPerPage: limit,
                },
                signal: context?.abortController?.signal,
            }
        )

        return {
            hits: data.hits || [],
            count: data.hits?.length || 0,
            query,
            source: 'HackerNews Algolia',
        }
    },
})

export const redditNewsTool = createTool({
    name: 'reddit_news',
    description:
        'Get news from Reddit subreddits. No API key required. Supports multiple categories: technology, business, worldnews, investing, CryptoCurrency, MachineLearning, etc.',
    tags: ['news', 'reddit', 'social', 'no-api-key'],
    parameters: z.object({
        subreddit: z
            .string()
            .default('technology')
            .describe('Subreddit name without r/ prefix'),
        sort: z.enum(['hot', 'new', 'top', 'rising']).default('hot'),
        limit: z.number().int().min(1).max(100).default(25),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        posts: z.array(
            z.object({
                title: z.string(),
                url: z.string(),
                permalink: z.string(),
                author: z.string(),
                score: z.number(),
                num_comments: z.number(),
                created_utc: z.number(),
                subreddit: z.string(),
                selftext: z.string().optional(),
                is_self: z.boolean(),
            })
        ),
        count: z.number(),
        subreddit: z.string(),
        sort: z.string(),
        source: z.string(),
    }),
    hooks: hooksFor('reddit_news'),
    execute: async ({ subreddit, sort, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const { data } = await client.get(
            `https://www.reddit.com/r/${subreddit}/${sort}.json`,
            {
                params: { limit },
                signal: context?.abortController?.signal,
            }
        )

        const posts =
            data.data?.children?.map((child: any) => ({
                title: child.data.title,
                url: child.data.url,
                permalink: `https://reddit.com${child.data.permalink}`,
                author: child.data.author,
                score: child.data.score,
                num_comments: child.data.num_comments,
                created_utc: child.data.created_utc,
                subreddit: child.data.subreddit,
                selftext: child.data.selftext,
                is_self: child.data.is_self,
            })) || []

        return {
            posts,
            count: posts.length,
            subreddit,
            sort,
            source: 'Reddit',
        }
    },
})

export const devtoArticlesTool = createTool({
    name: 'devto_articles',
    description:
        'Get latest articles from Dev.to. No API key required. Covers programming, AI, DevOps, career, and tech tutorials.',
    tags: ['news', 'devto', 'programming', 'ai', 'no-api-key'],
    parameters: z.object({
        tag: z
            .string()
            .optional()
            .describe('Filter by tag: ai, javascript, python, webdev, etc.'),
        limit: z.number().int().min(1).max(100).default(30),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        articles: z.array(
            z.object({
                id: z.number(),
                title: z.string(),
                url: z.string(),
                published_at: z.string(),
                tag_list: z.array(z.string()),
                user: z.object({
                    name: z.string(),
                    username: z.string(),
                }),
                positive_reactions_count: z.number(),
                comments_count: z.number(),
                reading_time_minutes: z.number(),
            })
        ),
        count: z.number(),
        tag: z.string().optional(),
        source: z.string(),
    }),
    hooks: hooksFor('devto_articles'),
    execute: async ({ tag, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const params: any = { per_page: limit }
        if (tag) {
            params.tag = tag
        }

        const { data } = await client.get('https://dev.to/api/articles', {
            params,
            signal: context?.abortController?.signal,
        })

        const articles = data.map((article: any) => ({
            id: article.id,
            title: article.title,
            url: article.url,
            published_at: article.published_at,
            tag_list: article.tag_list || [],
            user: {
                name: article.user?.name || '',
                username: article.user?.username || '',
            },
            positive_reactions_count: article.positive_reactions_count || 0,
            comments_count: article.comments_count || 0,
            reading_time_minutes: article.reading_time_minutes || 0,
        }))

        return {
            articles,
            count: articles.length,
            tag,
            source: 'Dev.to',
        }
    },
})

export const githubTrendingTool = createTool({
    name: 'github_trending',
    description:
        'Get trending GitHub repositories. No API key required. Discover popular new projects across languages.',
    tags: ['news', 'github', 'trending', 'programming', 'no-api-key'],
    parameters: z.object({
        language: z
            .string()
            .optional()
            .describe(
                'Programming language filter: javascript, python, typescript, go, rust, etc.'
            ),
        since: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
        limit: z.number().int().min(1).max(100).default(25),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        repositories: z.array(
            z.object({
                rank: z.number(),
                username: z.string(),
                repositoryName: z.string(),
                url: z.string(),
                description: z.string(),
                language: z.string().optional(),
                starsSince: z.number(),
                totalStars: z.number(),
                forks: z.number(),
            })
        ),
        count: z.number(),
        language: z.string().optional(),
        since: z.string(),
        source: z.string(),
    }),
    hooks: hooksFor('github_trending'),
    execute: async ({ language, since, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        // Using GitHub search API as a proxy for trending (sorted by stars)
        const query = language ? `language:${language}` : 'stars:>1000'
        const sort = 'stars'
        const order = 'desc'

        const { data } = await client.get(
            'https://api.github.com/search/repositories',
            {
                params: {
                    q: query,
                    sort,
                    order,
                    per_page: limit,
                },
                signal: context?.abortController?.signal,
            }
        )

        const repositories =
            data.items?.map((repo: any, index: number) => ({
                rank: index + 1,
                username: repo.owner?.login || '',
                repositoryName: repo.name,
                url: repo.html_url,
                description: repo.description || '',
                language: repo.language,
                starsSince: 0, // Not available from search API
                totalStars: repo.stargazers_count,
                forks: repo.forks_count,
            })) || []

        return {
            repositories,
            count: repositories.length,
            language,
            since,
            source: 'GitHub',
        }
    },
})

export const multiSourceNewsTool = createTool({
    name: 'multi_source_news',
    description:
        'Aggregate news from multiple free sources based on category. Combines HackerNews, Reddit, and Dev.to. No API keys required.',
    tags: ['news', 'aggregate', 'multi-source', 'no-api-key'],
    parameters: z.object({
        category: newsCategorySchema.default('technology'),
        limit: z.number().int().min(1).max(50).default(20),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        articles: z.array(
            z.object({
                title: z.string(),
                url: z.string(),
                source: z.string(),
                score: z.number(),
                timestamp: z.string(),
                category: z.string(),
                author: z.string().optional(),
                comments: z.number().optional(),
            })
        ),
        count: z.number(),
        category: z.string(),
        sourcesUsed: z.array(z.string()),
    }),
    hooks: hooksFor('multi_source_news'),
    execute: async ({ category, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const perSourceLimit = Math.ceil(limit / 2)
        const articles: any[] = []
        const sourcesUsed: string[] = []

        // Map categories to appropriate sources
        const subredditMap: Record<string, string> = {
            technology: 'technology',
            business: 'business',
            science: 'science',
            ai: 'MachineLearning',
            programming: 'programming',
            startups: 'startups',
            crypto: 'CryptoCurrency',
            stocks: 'stocks',
            forex: 'Forex',
            world: 'worldnews',
            general: 'news',
        }

        // Fetch from HackerNews for tech-related categories
        if (
            ['technology', 'programming', 'startups', 'ai', 'general'].includes(
                category
            )
        ) {
            try {
                const { data: storyIds } = await client.get<number[]>(
                    'https://hacker-news.firebaseio.com/v0/topstories.json',
                    { signal: context?.abortController?.signal }
                )

                const topIds = storyIds.slice(0, perSourceLimit)
                const hnStories = await Promise.all(
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

                hnStories
                    .filter((s) => s !== null && s.type === 'story' && s.url)
                    .forEach((story) => {
                        articles.push({
                            title: story.title,
                            url: story.url,
                            source: 'HackerNews',
                            score: story.score || 0,
                            timestamp: new Date(
                                story.time * 1000
                            ).toISOString(),
                            category,
                            author: story.by,
                            comments: story.descendants || 0,
                        })
                    })

                sourcesUsed.push('HackerNews')
            } catch (error) {
                voltlogger.warn('Failed to fetch HackerNews', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Fetch from Reddit
        try {
            const subreddit = subredditMap[category] || 'technology'
            const { data } = await client.get(
                `https://www.reddit.com/r/${subreddit}/hot.json`,
                {
                    params: { limit: perSourceLimit },
                    signal: context?.abortController?.signal,
                }
            )

            const posts =
                data.data?.children?.map((child: any) => ({
                    title: child.data.title,
                    url: child.data.url,
                    source: `Reddit r/${child.data.subreddit}`,
                    score: child.data.score,
                    timestamp: new Date(
                        child.data.created_utc * 1000
                    ).toISOString(),
                    category,
                    author: child.data.author,
                    comments: child.data.num_comments,
                })) || []

            articles.push(...posts)
            sourcesUsed.push('Reddit')
        } catch (error) {
            voltlogger.warn('Failed to fetch Reddit', {
                error: error instanceof Error ? error.message : String(error),
            })
        }

        // Fetch from Dev.to for programming/AI categories
        if (['technology', 'programming', 'ai', 'general'].includes(category)) {
            try {
                const tag = category === 'ai' ? 'ai' : undefined
                const { data } = await client.get(
                    'https://dev.to/api/articles',
                    {
                        params: { per_page: perSourceLimit, tag },
                        signal: context?.abortController?.signal,
                    }
                )

                const devArticles = data.map((article: any) => ({
                    title: article.title,
                    url: article.url,
                    source: 'Dev.to',
                    score: article.positive_reactions_count || 0,
                    timestamp: article.published_at,
                    category,
                    author: article.user?.name || article.user?.username,
                    comments: article.comments_count || 0,
                }))

                articles.push(...devArticles)
                sourcesUsed.push('Dev.to')
            } catch (error) {
                voltlogger.warn('Failed to fetch Dev.to', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Sort by score and limit results
        const sortedArticles = articles
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return {
            articles: sortedArticles,
            count: sortedArticles.length,
            category,
            sourcesUsed,
        }
    },
})

export const newsSearchTool = createTool({
    name: 'news_search',
    description:
        'Search for news across multiple sources. Searches HackerNews and Reddit. No API keys required.',
    tags: ['news', 'search', 'multi-source', 'no-api-key'],
    parameters: z.object({
        query: z.string().min(1).max(200),
        sources: z
            .array(z.enum(['hackernews', 'reddit', 'devto']))
            .default(['hackernews', 'reddit']),
        limit: z.number().int().min(1).max(50).default(20),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        results: z.array(
            z.object({
                title: z.string(),
                url: z.string(),
                source: z.string(),
                score: z.number(),
                timestamp: z.string().optional(),
                author: z.string().optional(),
                snippet: z.string().optional(),
            })
        ),
        count: z.number(),
        query: z.string(),
        sourcesSearched: z.array(z.string()),
    }),
    hooks: hooksFor('news_search'),
    execute: async ({ query, sources, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        const results: any[] = []
        const sourcesSearched: string[] = []
        const perSourceLimit = Math.ceil(limit / sources.length)

        // Search HackerNews via Algolia
        if (sources.includes('hackernews')) {
            try {
                const { data } = await client.get(
                    'https://hn.algolia.com/api/v1/search',
                    {
                        params: {
                            query,
                            hitsPerPage: perSourceLimit,
                        },
                        signal: context?.abortController?.signal,
                    }
                )

                data.hits?.forEach((hit: any) => {
                    results.push({
                        title: hit.title,
                        url:
                            hit.url ||
                            `https://news.ycombinator.com/item?id=${hit.objectID}`,
                        source: 'HackerNews',
                        score: hit.points || 0,
                        timestamp: hit.created_at,
                        author: hit.author,
                        snippet: hit.story_text?.substring(0, 200) || '',
                    })
                })

                sourcesSearched.push('HackerNews')
            } catch (error) {
                voltlogger.warn('Failed to search HackerNews', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Search Reddit (basic implementation via front page filter)
        if (sources.includes('reddit')) {
            try {
                // Search across multiple tech subreddits
                const searchSubs = [
                    'technology',
                    'programming',
                    'science',
                    'business',
                ]
                const subreddit = searchSubs[0]

                const { data } = await client.get(
                    `https://www.reddit.com/r/${subreddit}/hot.json`,
                    {
                        params: { limit: perSourceLimit * 2 },
                        signal: context?.abortController?.signal,
                    }
                )

                const posts =
                    data.data?.children
                        ?.filter((child: any) =>
                            child.data.title
                                .toLowerCase()
                                .includes(query.toLowerCase())
                        )
                        .slice(0, perSourceLimit)
                        .map((child: any) => ({
                            title: child.data.title,
                            url: child.data.url,
                            source: `Reddit r/${child.data.subreddit}`,
                            score: child.data.score,
                            timestamp: new Date(
                                child.data.created_utc * 1000
                            ).toISOString(),
                            author: child.data.author,
                            snippet:
                                child.data.selftext?.substring(0, 200) || '',
                        })) || []

                results.push(...posts)
                sourcesSearched.push('Reddit')
            } catch (error) {
                voltlogger.warn('Failed to search Reddit', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Search Dev.to
        if (sources.includes('devto')) {
            try {
                const { data } = await client.get(
                    'https://dev.to/api/articles',
                    {
                        params: { per_page: perSourceLimit * 2 },
                        signal: context?.abortController?.signal,
                    }
                )

                const articles = data
                    .filter((article: any) =>
                        article.title
                            .toLowerCase()
                            .includes(query.toLowerCase())
                    )
                    .slice(0, perSourceLimit)
                    .map((article: any) => ({
                        title: article.title,
                        url: article.url,
                        source: 'Dev.to',
                        score: article.positive_reactions_count || 0,
                        timestamp: article.published_at,
                        author: article.user?.name || article.user?.username,
                        snippet: article.description?.substring(0, 200) || '',
                    }))

                results.push(...articles)
                sourcesSearched.push('Dev.to')
            } catch (error) {
                voltlogger.warn('Failed to search Dev.to', {
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }
        }

        // Sort by score and return
        const sortedResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return {
            results: sortedResults,
            count: sortedResults.length,
            query,
            sourcesSearched,
        }
    },
})

export const trendingTopicsTool = createTool({
    name: 'trending_topics',
    description:
        'Get trending topics across tech and business news. Aggregates trending stories from HackerNews, Reddit, and Dev.to. No API keys required.',
    tags: ['news', 'trending', 'topics', 'no-api-key'],
    parameters: z.object({
        category: newsCategorySchema.default('technology'),
        limit: z.number().int().min(1).max(30).default(15),
        requestOptions: requestOptionsSchema.optional(),
    }),
    outputSchema: z.object({
        topics: z.array(
            z.object({
                topic: z.string(),
                mentions: z.number(),
                sources: z.array(z.string()),
                score: z.number(),
            })
        ),
        count: z.number(),
        category: z.string(),
        timestamp: z.string(),
    }),
    hooks: hooksFor('trending_topics'),
    execute: async ({ category, limit, requestOptions }, context) => {
        ensureActive(context)
        const opts = requestOptions ?? {
            timeoutMs: 15000,
            retries: 3,
            retryDelayMs: 700,
        }
        const client = buildHttpClient(opts)

        // Simple trending extraction based on keyword frequency
        const keywordCounts: Record<
            string,
            { count: number; sources: Set<string>; totalScore: number }
        > = {}

        // Fetch from HackerNews
        try {
            const { data: storyIds } = await client.get<number[]>(
                'https://hacker-news.firebaseio.com/v0/topstories.json',
                { signal: context?.abortController?.signal }
            )

            const topIds = storyIds.slice(0, 50)
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
                    const words = story.title
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')
                        .split(/\s+/)
                    words.forEach((word: string) => {
                        if (word.length > 4) {
                            if (!keywordCounts[word]) {
                                keywordCounts[word] = {
                                    count: 0,
                                    sources: new Set(),
                                    totalScore: 0,
                                }
                            }
                            keywordCounts[word].count++
                            keywordCounts[word].sources.add('HackerNews')
                            keywordCounts[word].totalScore += story.score || 0
                        }
                    })
                })
        } catch (error) {
            voltlogger.warn('Failed to fetch HackerNews for trending', {
                error: error instanceof Error ? error.message : String(error),
            })
        }

        // Convert to sorted topics
        const topics = Object.entries(keywordCounts)
            .filter(([, data]) => data.count >= 2)
            .map(([topic, data]) => ({
                topic,
                mentions: data.count,
                sources: Array.from(data.sources),
                score: data.totalScore,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return {
            topics,
            count: topics.length,
            category,
            timestamp: new Date().toISOString(),
        }
    },
})

// Export individual tools and toolkit array
export const newsAggregatorToolkit = [
    hackernewsTopStoriesTool,
    hackernewsSearchTool,
    redditNewsTool,
    devtoArticlesTool,
    githubTrendingTool,
    multiSourceNewsTool,
    newsSearchTool,
    trendingTopicsTool,
]

export default newsAggregatorToolkit
