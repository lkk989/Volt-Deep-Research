import { createToolkit, createTool } from '@voltagent/core'
import {
    RecursiveChunker,
    TokenChunker,
    SemanticChunker,
    MarkdownChunker,
    CodeChunker,
    HtmlChunker,
    JsonChunker,
} from '@voltagent/rag'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'
import { google } from '@ai-sdk/google'
import { AiSdkEmbeddingAdapter } from '@voltagent/core'
import { embedMany } from 'ai'

/**
 * RAG Toolkit for Mastervolt Deep Research.
 * Provides advanced chunking and partitioning strategies using @voltagent/rag.
 */
export const ragToolkit = createToolkit({
    name: 'rag_toolkit',
    description:
        'Advanced RAG toolkit providing various chunking and partitioning strategies for better semantic indexing.',
    instructions: `
Use these RAG tools to partition content before embedding and storage:

1. **chunk_content_recursive**: Best for general text. Splits by paragraph, then sentence, then token.
2. **chunk_content_token**: Splits by fixed token counts. Useful for models with strict window limits.
3. **chunk_content_semantic**: Merges adjacent chunks based on semantic similarity. Requires an embedder.
4. **chunk_content_markdown**: Format-aware chunker for Markdown documents. Preserves structural integrity.
5. **chunk_content_code**: Format-aware chunker for source code. Recognizes functions and classes.
6. **chunk_content_html**: Format-aware chunker for HTML content.
7. **chunk_content_json**: Format-aware chunker for JSON data.
8. **index_chunks**: Embed and store chunks in the agent's vector memory.

Tips:
- Use Semantic chunking for research reports to preserve conceptual continuity.
- Use Recursive chunking for general web scrapes.
- Use Markdown chunking when scraping documentation.
- Always use index_chunks after chunking to make information searchable.
`,
    addInstructions: true,
    tools: [
        createTool({
            name: 'chunk_content_recursive',
            description:
                'Splits text using recursive strategies (paragraphs -> sentences -> tokens).',
            parameters: z.object({
                content: z.string().describe('The text content to chunk'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(300)
                    .describe('Maximum tokens per chunk'),
                overlap: z
                    .number()
                    .optional()
                    .default(20)
                    .describe('Overlap between chunks'),
            }),
            execute: ({ content, maxTokens, overlap }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const chunker = new RecursiveChunker()
                const chunks = chunker.chunk(content, { maxTokens })

                voltlogger.info(
                    `Recursive chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'chunk_content_token',
            description: 'Splits text by fixed token counts.',
            parameters: z.object({
                content: z.string().describe('The text content to chunk'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(200)
                    .describe('Maximum tokens per chunk'),
                overlap: z
                    .number()
                    .optional()
                    .default(20)
                    .describe('Overlap between chunks'),
            }),
            execute: ({ content, maxTokens, overlap }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const chunker = new TokenChunker()
                const chunks = chunker.chunk(content, {
                    maxTokens,
                    overlap,
                })

                voltlogger.info(
                    `Token chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'chunk_content_semantic',
            description:
                'Merges adjacent text segments based on semantic similarity.',
            parameters: z.object({
                content: z.string().describe('The text content to chunk'),
                threshold: z
                    .number()
                    .optional()
                    .default(0.85)
                    .describe('Similarity threshold for merging (0.0 to 1.0)'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(300)
                    .describe('Maximum tokens per chunk'),
            }),
            execute: async ({ content, threshold, maxTokens }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const embedder = new AiSdkEmbeddingAdapter(
                    google.embedding('text-embedding-004')
                )
                const chunker = new SemanticChunker()

                const chunks = await chunker.chunk(content, {
                    embedder,
                    similarityThreshold: threshold,
                    maxTokens,
                })

                voltlogger.info(
                    `Semantic chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'chunk_content_markdown',
            description: 'Format-aware chunker for Markdown documents.',
            parameters: z.object({
                content: z.string().describe('The markdown content to chunk'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(500)
                    .describe('Maximum tokens per chunk'),
            }),
            execute: ({ content, maxTokens }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const chunker = new MarkdownChunker()
                const chunks = chunker.chunk(content, { maxTokens })

                voltlogger.info(
                    `Markdown chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'chunk_content_code',
            description: 'Format-aware chunker for source code.',
            parameters: z.object({
                content: z.string().describe('The code content to chunk'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(400)
                    .describe('Maximum tokens per chunk'),
            }),
            execute: ({ content, maxTokens }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const chunker = new CodeChunker()
                const chunks = chunker.chunk(content, { maxTokens })

                voltlogger.info(
                    `Code chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'chunk_content_html',
            description: 'Format-aware chunker for HTML content.',
            parameters: z.object({
                content: z.string().describe('The HTML content to chunk'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(400)
                    .describe('Maximum tokens per chunk'),
            }),
            execute: ({ content, maxTokens }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const chunker = new HtmlChunker()
                const chunks = chunker.chunk(content, { maxTokens })

                voltlogger.info(
                    `HTML chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'chunk_content_json',
            description: 'Format-aware chunker for JSON data.',
            parameters: z.object({
                content: z.string().describe('The JSON string to chunk'),
                maxTokens: z
                    .number()
                    .optional()
                    .default(400)
                    .describe('Maximum tokens per chunk'),
            }),
            execute: ({ content, maxTokens }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                const chunker = new JsonChunker()
                const chunks = chunker.chunk(content, { maxTokens })

                voltlogger.info(
                    `JSON chunking complete: ${chunks.length} chunks generated.`
                )
                return chunks
            },
        }),
        createTool({
            name: 'index_chunks',
            description:
                "Embed and store chunks in the agent's vector memory for later retrieval.",
            parameters: z.object({
                chunks: z
                    .array(
                        z.object({
                            content: z.string(),
                            metadata: z.record(z.string(), z.any()).optional(),
                        })
                    )
                    .describe('Array of chunks to index'),
                namespace: z
                    .string()
                    .optional()
                    .describe('Optional namespace for the indexed data'),
            }),
            execute: async ({ chunks, namespace }, context) => {
                if (!((context?.isActive) ?? false)) {throw new Error('Operation cancelled')}

                interface VectorPoint {
                    id: string
                    vector: number[]
                    payload: Record<string, unknown>
                }
                interface AgentVector { upsert: (collection: string, points: VectorPoint[]) => Promise<void> }
                interface AgentMemory { vector?: AgentVector }
                interface Agent { memory?: AgentMemory }

                const agent = context?.agent as Agent | undefined
                if (!agent?.memory?.vector) {
                    throw new Error('Agent has no vector memory configured')
                }

                const embeddingModel = google.embedding('text-embedding-004')
                const { embeddings } = await embedMany({
                    model: embeddingModel,
                    values: chunks.map((c) => c.content),
                })

                const points = chunks.map((c, i) => ({
                    id: Math.random().toString(36).substring(7),
                    vector: embeddings[i],
                    payload: {
                        ...c.metadata,
                        content: c.content,
                        namespace,
                        indexedAt: new Date().toISOString(),
                    },
                }))

                const collectionName = 'agent-knowledge'
                await agent.memory.vector.upsert(collectionName, points)

                voltlogger.info(
                    `Successfully indexed ${points.length} chunks into agent memory.`
                )
                return { count: points.length, success: true }
            },
        }),
    ],
})
