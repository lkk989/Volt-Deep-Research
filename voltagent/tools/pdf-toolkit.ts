import { getDocumentProxy, extractText, getMeta, extractLinks } from 'unpdf'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import {
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

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

const requestOptionsSchema = z
    .object({
        timeoutMs: z.number().int().min(1000).max(120000).default(30000),
        retries: z.number().int().min(0).max(5).default(2),
        retryDelayMs: z.number().int().min(100).max(10000).default(1000),
    })
    .default({ timeoutMs: 30000, retries: 2, retryDelayMs: 1000 })

const buildHttpClient = (options: z.infer<typeof requestOptionsSchema>) => {
    const client = axios.create({
        timeout: options.timeoutMs,
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'mastervolt-tools/1.0',
            Accept: 'application/pdf',
        },
    })
    axiosRetry(client, {
        retries: options.retries,
        retryDelay: () => options.retryDelayMs,
        retryCondition: (error) =>
            !error.response ||
            error.response.status >= 500 ||
            error.response.status === 429,
    })
    return client
}

const fetchPdfBuffer = async (
    url: string,
    options: z.infer<typeof requestOptionsSchema>,
    signal?: AbortSignal
): Promise<ArrayBuffer> => {
    const client = buildHttpClient(options)
    const response = await client.get<ArrayBuffer>(url, { signal })
    return response.data
}

// Helper to parse page range string "1-5, 8, 11-13" into array of page numbers (1-based)
const parsePageRange = (range: string, totalPages: number): number[] => {
    const pages = new Set<number>()
    const parts = range.split(',')

    for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map((n) => parseInt(n, 10))
            if (!isNaN(start) && !isNaN(end)) {
                for (
                    let i = Math.max(1, start);
                    i <= Math.min(totalPages, end);
                    i++
                ) {
                    pages.add(i)
                }
            }
        } else {
            const page = parseInt(trimmed, 10)
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                pages.add(page)
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b)
}

export const pdfExtractTextTool = createTool({
    name: 'pdf_extract_text',
    description:
        'Extract text content from a PDF file via URL. Supports extracting specific pages or ranges. Returns per-page text or merged text. Useful for reading research papers, reports, documentation, whitepapers, and other PDF documents.',
    tags: [
        'pdf',
        'text-extraction',
        'document',
        'research-paper',
        'report',
        'whitepaper',
        'reading',
    ],
    parameters: z.object({
        url: z
            .string()
            .url()
            .describe('URL of the PDF file to extract text from'),
        mergePages: z
            .boolean()
            .default(false)
            .describe('If true, merge all pages into a single string'),
        pageRange: z
            .string()
            .optional()
            .describe(
                'Specific pages to extract (e.g. "1-5, 8, 11-13"). If omitted, extracts all pages (subject to maxPages limit).'
            ),
        maxPages: z
            .number()
            .int()
            .min(1)
            .max(500)
            .optional()
            .describe('Maximum number of pages to extract (default: all)'),
        requestOptions: requestOptionsSchema,
    }),
    outputSchema: z.object({
        totalPages: z.number(),
        extractedPages: z.number(),
        text: z.union([z.string(), z.array(z.string())]),
    }),
    hooks: hooksFor('pdf_extract_text'),
    execute: async (args, context) => {
        ensureActive(context)

        const buffer = await fetchPdfBuffer(
            args.url,
            args.requestOptions,
            context?.abortController?.signal
        )
        const pdf = await getDocumentProxy(new Uint8Array(buffer))

        try {
            const totalPages = pdf.numPages
            const result = await extractText(pdf, { mergePages: false })
            const allText = Array.isArray(result.text)
                ? result.text
                : [result.text]

            let selectedText: string[] = []

            if (args.pageRange) {
                const pageIndices = parsePageRange(
                    args.pageRange,
                    totalPages
                ).map((p) => p - 1)
                selectedText = pageIndices.map((i) => allText[i] || '')
            } else {
                const limit = args.maxPages
                    ? Math.min(args.maxPages, totalPages)
                    : totalPages
                selectedText = allText.slice(0, limit)
            }

            if (args.mergePages) {
                return {
                    totalPages,
                    extractedPages: selectedText.length,
                    text: selectedText.join('\n\n'),
                }
            }

            return {
                totalPages,
                extractedPages: selectedText.length,
                text: selectedText,
            }
        } finally {
            pdf.cleanup()
        }
    },
})

export const pdfGetMetadataTool = createTool({
    name: 'pdf_get_metadata',
    description:
        'Extract metadata from a PDF file via URL. Returns title, author, subject, keywords, creation date, producer, page count. Useful for cataloging and understanding PDF documents before full extraction.',
    tags: ['pdf', 'metadata', 'document-info', 'title', 'author', 'catalog'],
    parameters: z.object({
        url: z.string().url().describe('URL of the PDF file'),
        requestOptions: requestOptionsSchema,
    }),
    outputSchema: z.object({
        totalPages: z.number(),
        info: z.record(z.string(), z.unknown()),
        metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    hooks: hooksFor('pdf_get_metadata'),
    execute: async (args, context) => {
        ensureActive(context)

        const buffer = await fetchPdfBuffer(
            args.url,
            args.requestOptions,
            context?.abortController?.signal
        )
        const pdf = await getDocumentProxy(new Uint8Array(buffer))

        try {
            const meta = await getMeta(pdf, { parseDates: true })

            const safeInfo: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(meta.info)) {
                if (
                    typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'boolean' ||
                    value === null
                ) {
                    safeInfo[key] = value
                } else if (value instanceof Date) {
                    safeInfo[key] = value.toISOString()
                } else {
                    safeInfo[key] = String(value)
                }
            }

            let safeMetadata: Record<string, unknown> | undefined = undefined
            if (meta.metadata) {
                try {
                    const metadataObj = meta.metadata as any
                    if (typeof metadataObj.getAll === 'function') {
                        safeMetadata = metadataObj.getAll()
                    } else {
                        safeMetadata = { ...metadataObj }
                    }
                } catch (e) {
                    // Ignore metadata parsing errors
                }
            }

            return {
                totalPages: pdf.numPages,
                info: safeInfo,
                metadata: safeMetadata,
            }
        } finally {
            pdf.cleanup()
        }
    },
})

export const pdfExtractLinksTool = createTool({
    name: 'pdf_extract_links',
    description:
        'Extract all hyperlinks from a PDF document via URL. Returns a list of URLs found in the document. Useful for finding references, citations, and related resources in academic papers and reports.',
    tags: ['pdf', 'links', 'hyperlinks', 'references', 'citations', 'urls'],
    parameters: z.object({
        url: z.string().url().describe('URL of the PDF file'),
        requestOptions: requestOptionsSchema,
    }),
    outputSchema: z.object({
        totalPages: z.number(),
        linkCount: z.number(),
        links: z.array(z.string()),
    }),
    hooks: hooksFor('pdf_extract_links'),
    execute: async (args, context) => {
        ensureActive(context)

        const buffer = await fetchPdfBuffer(
            args.url,
            args.requestOptions,
            context?.abortController?.signal
        )
        const pdf = await getDocumentProxy(new Uint8Array(buffer))

        try {
            const result = await extractLinks(pdf)

            const uniqueLinks = [...new Set(result.links)].filter(
                (link) =>
                    link.startsWith('http://') || link.startsWith('https://')
            )

            return {
                totalPages: result.totalPages,
                linkCount: uniqueLinks.length,
                links: uniqueLinks,
            }
        } finally {
            pdf.cleanup()
        }
    },
})

export const pdfGetOutlineTool = createTool({
    name: 'pdf_get_outline',
    description:
        'Extract the outline (table of contents / bookmarks) from a PDF file. Returns a hierarchical structure of chapters and sections. Useful for understanding document structure and navigation.',
    tags: ['pdf', 'outline', 'toc', 'bookmarks', 'structure', 'chapters'],
    parameters: z.object({
        url: z.string().url().describe('URL of the PDF file'),
        requestOptions: requestOptionsSchema,
    }),
    outputSchema: z.object({
        totalPages: z.number(),
        outline: z
            .array(
                z.object({
                    title: z.string(),
                    bold: z.boolean(),
                    italic: z.boolean(),
                    color: z.any().optional(),
                    dest: z.any().optional(),
                    url: z.string().optional(),
                    items: z.array(z.any()).optional(),
                })
            )
            .nullable(),
    }),
    hooks: hooksFor('pdf_get_outline'),
    execute: async (args, context) => {
        ensureActive(context)

        const buffer = await fetchPdfBuffer(
            args.url,
            args.requestOptions,
            context?.abortController?.signal
        )
        const pdf = await getDocumentProxy(new Uint8Array(buffer))

        try {
            const outline = await pdf.getOutline()

            const simplifyOutline = (items: any[]): any[] => {
                return items.map((item) => ({
                    title: item.title,
                    bold: item.bold,
                    italic: item.italic,
                    color: item.color,
                    dest: item.dest,
                    url: item.url,
                    items:
                        item.items && item.items.length > 0
                            ? simplifyOutline(item.items)
                            : [],
                }))
            }

            return {
                totalPages: pdf.numPages,
                outline: outline ? simplifyOutline(outline) : null,
            }
        } finally {
            pdf.cleanup()
        }
    },
})
