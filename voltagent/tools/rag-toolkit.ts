import { google } from '@ai-sdk/google'
import {
    AiSdkEmbeddingAdapter,
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import {
    CodeChunker,
    HtmlChunker,
    JsonChunker,
    LatexChunker,
    MarkdownChunker,
    RecursiveChunker,
    SemanticChunker,
    SemanticMarkdownChunker,
    SentenceChunker,
    SlumberChunker,
    StructuredDocument,
    TableChunker,
    TokenChunker,
} from '@voltagent/rag'
import { embedMany } from 'ai'
import { z } from 'zod'
import { sharedVectorAdapter } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'

const chunkMetadataSchema = z.object({
    docId: z.string().optional(),
    sourceId: z.string().optional(),
    baseMetadata: z.record(z.string(), z.unknown()).optional(),
})

const normalizedChunkSchema = z.object({
    content: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

type ChunkItem = {
    content?: string
    text?: string
    metadata?: Record<string, unknown>
}

const normalizedChunkArraySchema = z.array(normalizedChunkSchema)

const chunkStrategySchema = z.enum([
    'auto',
    'markdown',
    'html',
    'json',
    'latex',
    'recursive',
    'sentence',
    'token',
    'table',
    'code',
])

const normalizeChunkForOutput = (input: unknown): ChunkItem => {
    if (typeof input === 'string') {
        return { content: input }
    }

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return {}
    }

    const candidate = input as Record<string, unknown>
    const content = typeof candidate.content === 'string' ? candidate.content : undefined
    const text = typeof candidate.text === 'string' ? candidate.text : undefined
    const metadata =
        typeof candidate.metadata === 'object' &&
        candidate.metadata !== null &&
        !Array.isArray(candidate.metadata)
            ? (candidate.metadata as Record<string, unknown>)
            : undefined

    return { content, text, metadata }
}

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const normalizeChunkInput = (input: unknown): z.infer<typeof normalizedChunkSchema> => {
    if (typeof input === 'string') {
        return { content: input }
    }

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new Error('Unsupported chunk format. Expected string or object chunk.')
    }

    const candidate = input as Record<string, unknown>
    const possibleTextFields = ['content', 'text', 'body', 'chunk']

    for (const field of possibleTextFields) {
        const value = candidate[field]
        if (typeof value === 'string' && value.trim().length > 0) {
            const metadata =
                typeof candidate.metadata === 'object' &&
                candidate.metadata !== null &&
                !Array.isArray(candidate.metadata)
                    ? (candidate.metadata as Record<string, unknown>)
                    : undefined

            return {
                content: value,
                metadata,
            }
        }
    }

    throw new Error(
        'Unable to normalize chunk object. Provide one of: content, text, body, chunk.'
    )
}

const extractChunksFromInput = (input: unknown): unknown[] => {
    if (Array.isArray(input)) {
        return input
    }

    if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
        const maybe = input as Record<string, unknown>
        if (Array.isArray(maybe.chunks)) {
            return maybe.chunks
        }
    }

    throw new Error('Invalid chunks payload. Expected chunk array or object containing chunks array.')
}

const withCommonChunkParams = <T extends z.ZodRawShape>(shape: T) =>
    z.object({
        ...shape,
        metadata: chunkMetadataSchema.optional(),
    })

export const chunkContentRecursiveTool = createTool({
    name: 'chunk_content_recursive',
    description: 'Chunk plain text recursively with token overlap controls.',
    tags: ['rag', 'chunking', 'recursive'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(300),
        overlapTokens: z.number().int().min(0).max(1000).default(20),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('recursive'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_recursive: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_recursive: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_recursive: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
        },
    },
    execute: ({ content, maxTokens, overlapTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new RecursiveChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            overlapTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'recursive' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentTokenTool = createTool({
    name: 'chunk_content_token',
    description: 'Chunk text by strict token windows with overlap.',
    tags: ['rag', 'chunking', 'token'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(200),
        overlap: z.number().int().min(0).max(1000).default(20),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('token'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_token: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_token: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_token: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
        },
    },
    execute: ({ content, maxTokens, overlap, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new TokenChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            overlap,
            label,
            ...metadata,
        })
        return {
            chunker: 'token' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentSentenceTool = createTool({
    name: 'chunk_content_sentence',
    description: 'Chunk text by sentence boundaries with sentence overlap.',
    tags: ['rag', 'chunking', 'sentence'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(300),
        overlapSentences: z.number().int().min(0).max(20).default(1),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('sentence'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_sentence: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_sentence: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_sentence: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
        },
    },
    execute: (
        { content, maxTokens, overlapSentences, label, metadata },
        context
    ) => {
        ensureActive(context)
        const chunker = new SentenceChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            overlapSentences,
            label,
            ...metadata,
        })
        return {
            chunker: 'sentence' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentTableTool = createTool({
    name: 'chunk_content_table',
    description: 'Chunk table-heavy text while preserving tabular boundaries.',
    tags: ['rag', 'chunking', 'table'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('table'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_table: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_table: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_table: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
        },
    },
    execute: ({ content, maxTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new TableChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'table' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentCodeTool = createTool({
    name: 'chunk_content_code',
    description: 'Chunk source code with parser-aware boundaries and fallback.',
    tags: ['rag', 'chunking', 'code'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('code'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_code: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_code: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_code: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
        },
    },
    execute: ({ content, maxTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new CodeChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'code' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentMarkdownTool = createTool({
    name: 'chunk_content_markdown',
    description: 'Chunk markdown with heading and block awareness.',
    tags: ['rag', 'chunking', 'markdown'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(500),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('markdown'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_markdown: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_markdown: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_markdown: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
        },
    },
    execute: ({ content, maxTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new MarkdownChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'markdown' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentHtmlTool = createTool({
    name: 'chunk_content_html',
    description: 'Chunk HTML while preserving meaningful structural segments.',
    tags: ['rag', 'chunking', 'html'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('html'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_html: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_html: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_html: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: ({ content, maxTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new HtmlChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'html' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentJsonTool = createTool({
    name: 'chunk_content_json',
    description: 'Chunk JSON with structure-aware segmentation.',
    tags: ['rag', 'chunking', 'json'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('json'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_json: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_json: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_json: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: ({ content, maxTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new JsonChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'json' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentLatexTool = createTool({
    name: 'chunk_content_latex',
    description: 'Chunk LaTeX documents while preserving formula context.',
    tags: ['rag', 'chunking', 'latex'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('latex'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_latex: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_latex: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_latex: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: ({ content, maxTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new LatexChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'latex' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentSlumberTool = createTool({
    name: 'chunk_content_slumber',
    description: 'Smooth chunk distribution to avoid tiny low-signal fragments.',
    tags: ['rag', 'chunking', 'slumber'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(350),
        minTokens: z.number().int().min(20).max(4000).default(120),
        overlapTokens: z.number().int().min(0).max(1000).default(20),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('slumber'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_slumber: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_slumber: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_slumber: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: ({ content, maxTokens, minTokens, overlapTokens, label, metadata }, context) => {
        ensureActive(context)
        const chunker = new SlumberChunker()
        const chunks = chunker.chunk(content, {
            maxTokens,
            minTokens,
            overlapTokens,
            label,
            ...metadata,
        })
        return {
            chunker: 'slumber' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentSemanticTool = createTool({
    name: 'chunk_content_semantic',
    description:
        'Chunk by semantic coherence using embeddings and similarity thresholds.',
    tags: ['rag', 'chunking', 'semantic', 'embedding'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(300),
        similarityThreshold: z.number().min(0).max(1).default(0.85),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('semantic'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_semantic: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_semantic: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_semantic: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: async (
        {
            content,
            maxTokens,
            similarityThreshold,
            label,
            metadata,
        },
        context
    ) => {
        ensureActive(context)
        const embedder = new AiSdkEmbeddingAdapter(
            google.embedding('gemini-embedding-001')
        )
        const chunker = new SemanticChunker()
        const chunks = await chunker.chunk(content, {
            embedder,
            maxTokens,
            similarityThreshold,
            label,
            ...metadata,
        })
        return {
            chunker: 'semantic' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkContentSemanticMarkdownTool = createTool({
    name: 'chunk_content_semantic_markdown',
    description:
        'Run markdown-aware chunking then semantic merge for higher quality retrieval chunks.',
    tags: ['rag', 'chunking', 'semantic', 'markdown', 'embedding'],
    parameters: withCommonChunkParams({
        content: z.string().min(1),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        similarityThreshold: z.number().min(0).max(1).default(0.85),
        label: z.string().optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('semantic_markdown'),
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_content_semantic_markdown: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_content_semantic_markdown: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_content_semantic_markdown: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: async (
        {
            content,
            maxTokens,
            similarityThreshold,
            label,
            metadata,
        },
        context
    ) => {
        ensureActive(context)
        const embedder = new AiSdkEmbeddingAdapter(
            google.embedding('gemini-embedding-001')
        )
        const chunker = new SemanticMarkdownChunker()
        const chunks = await chunker.chunk(content, {
            embedder,
            maxTokens,
            similarityThreshold,
            label,
            ...metadata,
        })
        return {
            chunker: 'semantic_markdown' as const,
            count: chunks.length,
            chunks: (chunks as unknown[]).map((chunk) => normalizeChunkForOutput(chunk)),
        }
    },
})

export const chunkStructuredDocumentTool = createTool({
    name: 'chunk_structured_document',
    description:
        'Chunk using StructuredDocument strategies (auto/markdown/html/json/latex/etc).',
    tags: ['rag', 'chunking', 'structured-document'],
    parameters: z.object({
        content: z.string().min(1),
        strategy: chunkStrategySchema.default('auto'),
        maxTokens: z.number().int().min(50).max(8000).default(400),
        metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    outputSchema: z.object({
        chunker: z.literal('structured_document'),
        strategy: chunkStrategySchema,
        count: z.number().int().min(0),
        chunks: z.array(
            z.object({
                content: z.string().optional(),
                text: z.string().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        ),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('chunk_structured_document: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('chunk_structured_document: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('chunk_structured_document: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: ({ content, strategy, maxTokens, metadata }, context) => {
        ensureActive(context)

        const document = StructuredDocument.fromText(content, metadata)
        const { chunks } = document.chunk({
            strategy,
            maxTokens,
        })
        return {
            chunker: 'structured_document' as const,
            strategy,
            count: chunks.length,
            chunks,
        }
    },
})

export const normalizeChunksTool = createTool({
    name: 'normalize_chunks',
    description:
        'Normalize mixed chunk outputs into {content, metadata?} objects for indexing tools.',
    tags: ['rag', 'chunking', 'normalize'],
    parameters: z.object({
        chunks: z.union([
            z.array(z.unknown()),
            z.object({
                chunks: z.array(z.unknown()),
            }),
        ]),
    }),
    outputSchema: normalizedChunkArraySchema,
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('normalize_chunks: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('normalize_chunks: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('normalize_chunks: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: ({ chunks }, context) => {
        ensureActive(context)
        const sourceChunks = extractChunksFromInput(chunks)
        return sourceChunks.map((chunk) => normalizeChunkInput(chunk))
    },
})

export const createChunkEmbeddingsTool = createTool({
    name: 'create_chunk_embeddings',
    description:
        'Generate embeddings for normalized chunks without persisting them.',
    tags: ['rag', 'embedding', 'diagnostics'],
    parameters: z.object({
        chunks: normalizedChunkArraySchema,
    }),
    outputSchema: z.object({
        count: z.number(),
        dimensions: z.number(),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('create_chunk_embeddings: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('create_chunk_embeddings: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('create_chunk_embeddings: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: async ({ chunks }, context) => {
        ensureActive(context)

        const { embeddings } = await embedMany({
            model: google.embedding('gemini-embedding-001'),
            values: chunks.map((chunk) => chunk.content),
        })

        return {
            count: embeddings.length,
            dimensions: embeddings[0]?.length ?? 0,
        }
    },
})

export const indexChunksTool = createTool({
    name: 'index_chunks',
    description: 'Index normalized chunks into agent memory vector storage.',
    tags: ['rag', 'indexing', 'memory', 'embedding'],
    parameters: z.object({
        chunks: normalizedChunkArraySchema,
        namespace: z.string().optional(),
        collectionName: z.string().default('agent-knowledge'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        backend: z.literal('memory'),
        count: z.number(),
        collectionName: z.string().optional(),
        ids: z.array(z.union([z.string(), z.number()])).optional(),
    }),
    hooks: {
        onStart: async ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info('index_chunks: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            })
        },
        onEnd: async ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error) {
                voltlogger.error('index_chunks: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : String(error),
                })
                return
            }

            voltlogger.info('index_chunks: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return
        },
    },
    execute: async ({ chunks, namespace, collectionName }, context) => {
        ensureActive(context)

        const { embeddings } = await embedMany({
            model: google.embedding('gemini-embedding-001'),
            values: chunks.map((chunk) => chunk.content),
        })

        await Promise.all(
            chunks.map(async (chunk, index) => {
                await sharedVectorAdapter.storeBatch([{
                    id: `${collectionName}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                    vector: embeddings[index],
                    content: chunk.content,
                    metadata: {
                        ...(chunk.metadata ?? {}),
                        namespace,
                        collectionName,
                        indexedAt: new Date().toISOString(),
                    },
                }])
            })
        )

        return {
            success: true,
            backend: 'memory' as const,
            count: chunks.length,
            collectionName,
        }
    },
})


