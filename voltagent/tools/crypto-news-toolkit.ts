import {
  createTool,
  type ToolExecuteOptions,
  type ToolHookOnEndArgs,
  type ToolHookOnStartArgs,
} from '@voltagent/core'
import axios, { type AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

const BASE_URL = 'https://cryptocurrency.cv'

const requestOptionsSchema = z
  .object({
    timeoutMs: z.number().int().min(1000).max(60000).default(15000),
    retries: z.number().int().min(0).max(8).default(3),
    retryDelayMs: z.number().int().min(100).max(10000).default(700),
  })
  .default({ timeoutMs: 15000, retries: 3, retryDelayMs: 700 })

const categorySchema = z.enum([
  'bitcoin',
  'ethereum',
  'defi',
  'solana',
  'altcoin',
  'regulation',
  'nft',
  'web3',
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

const createNewsClient = (options?: z.infer<typeof requestOptionsSchema>) => {
  const opts = requestOptionsSchema.parse(options)
  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: opts.timeoutMs,
    headers: {
      Accept: 'application/json',
    },
  })

  axiosRetry(client, {
    retries: opts.retries,
    retryDelay: () => opts.retryDelayMs,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      (error.response?.status ? error.response.status >= 500 : false),
  })

  return client
}

export const getCryptoNews = createTool({
  name: 'get_crypto_news',
  description:
    'Get latest cryptocurrency news from aggregated sources. 100% free, no API key required. Supports Bitcoin, Ethereum, DeFi, Solana, altcoins, regulation, NFT, and Web3 categories.',
  parameters: z.object({
    category: categorySchema.default('bitcoin'),
    limit: z.number().int().min(1).max(50).default(10),
    lang: z
      .enum(['en', 'es', 'de', 'fr', 'ja', 'ko', 'zh', 'pt', 'ru'])
      .default('en'),
    requestOptions: requestOptionsSchema.optional(),
  }),
  ...hooksFor('get_crypto_news'),
  execute: async (args, context) => {
    ensureActive(context)
    const { category, limit, lang, requestOptions } = args
    const client = createNewsClient(requestOptions)

    try {
      const response = await client.get('/api/news', {
        params: {
          category,
          limit,
          lang,
        },
      })

      const articles = response.data.articles || response.data.news || []

      return {
        success: true,
        category,
        count: articles.length,
        articles: articles
          .slice(0, limit)
          .map(
            (article: {
              title?: string
              description?: string
              url?: string
              source?: string | { name?: string }
              publishedAt?: string
              image?: string
            }) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: typeof article.source === 'string' ? article.source : article.source?.name,
              publishedAt: article.publishedAt,
              image: article.image,
            })
          ),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      voltlogger.error(`get_crypto_news failed: ${message}`, {
        category,
        limit,
        lang,
      })
      return {
        success: false,
        error: message,
        category,
      }
    }
  },
})

export const searchCryptoNews = createTool({
  name: 'search_crypto_news',
  description:
    'Search cryptocurrency news by keyword. 100% free, no API key required. Uses free-crypto-news aggregation API.',
  parameters: z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).default(10),
    lang: z
      .enum(['en', 'es', 'de', 'fr', 'ja', 'ko', 'zh', 'pt', 'ru'])
      .default('en'),
    requestOptions: requestOptionsSchema.optional(),
  }),
  ...hooksFor('search_crypto_news'),
  execute: async (args, context) => {
    ensureActive(context)
    const { query, limit, lang, requestOptions } = args
    const client = createNewsClient(requestOptions)

    try {
      const response = await client.get('/api/news/search', {
        params: {
          q: query,
          limit,
          lang,
        },
      })

      const articles = response.data.articles || response.data.news || []

      return {
        success: true,
        query,
        count: articles.length,
        articles: articles
          .slice(0, limit)
          .map(
            (article: {
              title?: string
              description?: string
              url?: string
              source?: string | { name?: string }
              publishedAt?: string
              image?: string
            }) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: typeof article.source === 'string' ? article.source : article.source?.name,
              publishedAt: article.publishedAt,
              image: article.image,
            })
          ),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      voltlogger.error(`search_crypto_news failed: ${message}`, {
        query,
        limit,
        lang,
      })
      return {
        success: false,
        error: message,
        query,
      }
    }
  },
})

export const getLatestHeadlines = createTool({
  name: 'get_latest_headlines',
  description:
    'Get latest cryptocurrency headlines across all categories. 100% free, no API key required. Returns top headlines ranked by relevance.',
  parameters: z.object({
    limit: z.number().int().min(1).max(50).default(20),
    lang: z
      .enum(['en', 'es', 'de', 'fr', 'ja', 'ko', 'zh', 'pt', 'ru'])
      .default('en'),
    requestOptions: requestOptionsSchema.optional(),
  }),
  ...hooksFor('get_latest_headlines'),
  execute: async (args, context) => {
    ensureActive(context)
    const { limit, lang, requestOptions } = args
    const client = createNewsClient(requestOptions)

    try {
      const response = await client.get('/api/headlines', {
        params: {
          limit,
          lang,
        },
      })

      const articles =
        response.data.articles || response.data.headlines || []

      return {
        success: true,
        count: articles.length,
        articles: articles
          .slice(0, limit)
          .map(
            (article: {
              title?: string
              description?: string
              url?: string
              source?: string | { name?: string }
              publishedAt?: string
              image?: string
              category?: string
            }) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: typeof article.source === 'string' ? article.source : article.source?.name,
              publishedAt: article.publishedAt,
              image: article.image,
              category: article.category,
            })
          ),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      voltlogger.error(`get_latest_headlines failed: ${message}`, {
        limit,
        lang,
      })
      return {
        success: false,
        error: message,
      }
    }
  },
})

export const getNewsBySource = createTool({
  name: 'get_news_by_source',
  description:
    'Get cryptocurrency news from a specific source. 100% free, no API key required. Available sources: coindesk, coindesk, decrypt, theblock, crypto-slate, bitcoin-magazine, decrypt, defi-llama',
  parameters: z.object({
    source: z.string().min(1).max(50),
    limit: z.number().int().min(1).max(50).default(10),
    requestOptions: requestOptionsSchema.optional(),
  }),
  ...hooksFor('get_news_by_source'),
  execute: async (args, context) => {
    ensureActive(context)
    const { source, limit, requestOptions } = args
    const client = createNewsClient(requestOptions)

    try {
      const response = await client.get(`/api/news/source/${source}`, {
        params: {
          limit,
        },
      })

      const articles = response.data.articles || response.data.news || []

      return {
        success: true,
        source,
        count: articles.length,
        articles: articles
          .slice(0, limit)
          .map(
            (article: {
              title?: string
              description?: string
              url?: string
              source?: string | { name?: string }
              publishedAt?: string
              image?: string
            }) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: typeof article.source === 'string' ? article.source : article.source?.name,
              publishedAt: article.publishedAt,
              image: article.image,
            })
          ),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      voltlogger.error(`get_news_by_source failed: ${message}`, {
        source,
        limit,
      })
      return {
        success: false,
        error: message,
        source,
      }
    }
  },
})

export const getTrendingTopics = createTool({
  name: 'get_trending_topics',
  description:
    'Get trending cryptocurrency topics and hashtags. 100% free, no API key required. Returns currently trending topics in the crypto space.',
  parameters: z.object({
    limit: z.number().int().min(1).max(20).default(10),
    requestOptions: requestOptionsSchema.optional(),
  }),
  ...hooksFor('get_trending_topics'),
  execute: async (args, context) => {
    ensureActive(context)
    const { limit, requestOptions } = args
    const client = createNewsClient(requestOptions)

    try {
      const response = await client.get('/api/trending', {
        params: {
          limit,
        },
      })

      const topics = response.data.topics || response.data.trending || []

      return {
        success: true,
        count: topics.length,
        topics: topics
          .slice(0, limit)
          .map(
            (topic: {
              topic?: string
              name?: string
              volume?: number
              sentiment?: string
            }) => ({
              topic: topic.topic || topic.name,
              volume: topic.volume,
              sentiment: topic.sentiment,
            })
          ),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      voltlogger.error(`get_trending_topics failed: ${message}`, {
        limit,
      })
      return {
        success: false,
        error: message,
      }
    }
  },
})

export const getMarketContext = createTool({
  name: 'get_market_context',
  description:
    'Get market context with news and sentiment. 100% free, no API key required. Returns news articles with market sentiment indicators.',
  parameters: z.object({
    market: z
      .enum(['bitcoin', 'ethereum', 'defi', 'solana', 'total'])
      .default('total'),
    limit: z.number().int().min(1).max(30).default(10),
    requestOptions: requestOptionsSchema.optional(),
  }),
  ...hooksFor('get_market_context'),
  execute: async (args, context) => {
    ensureActive(context)
    const { market, limit, requestOptions } = args
    const client = createNewsClient(requestOptions)

    try {
      const response = await client.get(`/api/market/${market}`, {
        params: {
          limit,
        },
      })

      const articles = response.data.articles || response.data.news || []
      const sentiment = response.data.sentiment || {}

      return {
        success: true,
        market,
        sentiment: {
          overall: sentiment.overall || sentiment.score,
          bullish: sentiment.bullish,
          bearish: sentiment.bearish,
          neutral: sentiment.neutral,
        },
        count: articles.length,
        articles: articles
          .slice(0, limit)
          .map(
            (article: {
              title?: string
              description?: string
              url?: string
              source?: string | { name?: string }
              publishedAt?: string
              sentiment?: string
            }) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: typeof article.source === 'string' ? article.source : article.source?.name,
              publishedAt: article.publishedAt,
              sentiment: article.sentiment,
            })
          ),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      voltlogger.error(`get_market_context failed: ${message}`, {
        market,
        limit,
      })
      return {
        success: false,
        error: message,
        market,
      }
    }
  },
})

export const cryptoNewsToolkit = [
  getCryptoNews,
  searchCryptoNews,
  getLatestHeadlines,
  getNewsBySource,
  getTrendingTopics,
  getMarketContext,
]

export default cryptoNewsToolkit
