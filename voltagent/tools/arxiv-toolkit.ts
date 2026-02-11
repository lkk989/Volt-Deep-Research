import {
    createTool,
    createToolkit,
    type Tool,
    type ToolHookOnStartArgs,
    type ToolHookOnEndArgs,
} from '@voltagent/core'
import type { ToolExecuteOptions } from '@voltagent/core'
import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

// Types for arXiv API response
interface ArxivEntry {
    id: string
    title: string
    author: { name: string } | Array<{ name: string }>
    summary: string
    published: string
    updated: string
    category: { '@_term': string } | Array<{ '@_term': string }>
    link: Array<{
        '@_title'?: string
        '@_rel'?: string
        '@_type'?: string
        '@_href': string
    }>
    'arxiv:doi'?: string
    'arxiv:comment'?: string
    'arxiv:journal_ref'?: string
}

interface ArxivFeed {
    feed: {
        entry: ArxivEntry | ArxivEntry[]
    }
}

interface ProcessedPaper {
    id: string
    title: string
    authors: string[]
    summary: string
    published: string
    updated: string
    categories: string[]
    pdfUrl?: string
    doi?: string
    comment?: string
    journal_ref?: string
}

// Types for PDF parsing result
interface PdfParseResult {
    numpages: number
    text: string
    info?: {
        Title?: string
        Author?: string
        Subject?: string
        Creator?: string
    }
    hasEOL?: boolean
}

export const arxivSearchTool = createTool({
    name: 'arxiv_search',
    description:
        'Search arXiv for academic papers using the arXiv API. Returns paper metadata including titles, authors, abstracts, and PDF links.',
    tags: ['arxiv', 'academic', 'research', 'papers'],
    parameters: z.object({
        query: z
            .string()
            .describe(
                "Search query using arXiv syntax (e.g., 'machine learning' or 'ti:machine learning' for title search)"
            ),
        maxResults: z
            .number()
            .min(1)
            .max(100)
            .default(10)
            .describe('Maximum number of results to return (1-100)'),
        sortBy: z
            .enum(['relevance', 'submittedDate', 'lastUpdatedDate'])
            .default('relevance')
            .describe(
                'Sort results by relevance, submission date, or last updated date'
            ),
        sortOrder: z
            .enum(['ascending', 'descending'])
            .default('descending')
            .describe('Sort order'),
    }),
    outputSchema: z.object({
        query: z.string(),
        totalResults: z.number(),
        papers: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                authors: z.array(z.string()),
                summary: z.string(),
                published: z.string(),
                updated: z.string(),
                categories: z.array(z.string()),
                pdfUrl: z.string().optional(),
                doi: z.string().optional(),
                comment: z.string().optional(),
                journal_ref: z.string().optional(),
            })
        ),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { query: string; maxResults: number }
            voltlogger.info('arxiv_search: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                query: params.query,
                maxResults: params.maxResults,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('arxiv_search: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('arxiv_search: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: async (args, context?: ToolExecuteOptions) => {
        if (!context?.isActive) {
            throw new Error('Operation has been cancelled')
        }

        voltlogger.info(`Searching arXiv for: ${args.query}`)

        try {
            // Build arXiv API query
            const baseUrl = 'http://export.arxiv.org/api/query'
            const params = new URLSearchParams({
                search_query: args.query,
                max_results: args.maxResults.toString(),
                sortBy:
                    args.sortBy === 'relevance'
                        ? 'relevance'
                        : args.sortBy === 'submittedDate'
                          ? 'submittedDate'
                          : 'lastUpdatedDate',
                sortOrder: args.sortOrder,
            })

            const response = await fetch(`${baseUrl}?${params}`)
            if (!response.ok) {
                throw new Error(
                    `arXiv API error: ${response.status} ${response.statusText}`
                )
            }

            const xmlText = await response.text()

            // Parse XML response
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
            })

            const result = parser.parse(xmlText) as ArxivFeed

            // Extract entries
            const {feed} = result
            const entries: ArxivEntry[] = Array.isArray(feed.entry)
                ? feed.entry
                : [feed.entry]

            // Helper: normalize value that may be string or single-element array
            const toStringOrUndefined = (v: unknown): string | undefined => {
                if (typeof v === 'string') {
                    return v
                }
                if (
                    Array.isArray(v) &&
                    v.length > 0 &&
                    typeof v[0] === 'string'
                ) {
                    return v[0]
                }
                return undefined
            }

            // Helper: extract authors from ArxivEntry author field
            const extractAuthors = (
                authorField: ArxivEntry['author']
            ): string[] => {
                if (!authorField) {
                    return []
                }
                if (Array.isArray(authorField)) {
                    return authorField
                        .map((a) => toStringOrUndefined(a.name))
                        .filter(Boolean) as string[]
                }
                const name = toStringOrUndefined(authorField.name)
                return name ? [name] : []
            }

            // Helper: extract categories from ArxivEntry category field
            const extractCategories = (
                catField: ArxivEntry['category']
            ): string[] => {
                if (!catField) {
                    return []
                }
                if (Array.isArray(catField)) {
                    return catField
                        .map((c) => toStringOrUndefined(c['@_term']))
                        .filter(Boolean) as string[]
                }
                const term = toStringOrUndefined(catField['@_term'])
                return term ? [term] : []
            }

            // Helper: find PDF URL from ArxivEntry link field
            const findPdfUrl = (
                linkField: ArxivEntry['link']
            ): string | undefined => {
                if (!linkField) {
                    return undefined
                }
                const links = Array.isArray(linkField) ? linkField : [linkField]

                const pdfByTitle = links.find(
                    (l) => toStringOrUndefined(l['@_title']) === 'pdf'
                )
                if (pdfByTitle) {
                    return toStringOrUndefined(pdfByTitle['@_href'])
                }

                const pdfByRel = links.find(
                    (l) =>
                        toStringOrUndefined(l['@_rel']) === 'alternate' &&
                        toStringOrUndefined(l['@_type']) === 'application/pdf'
                )
                return pdfByRel
                    ? toStringOrUndefined(pdfByRel['@_href'])
                    : undefined
            }

            const papers: ProcessedPaper[] = entries.map(
                (entry: ArxivEntry) => {
                    return {
                        id: toStringOrUndefined(entry.id) ?? '',
                        title: toStringOrUndefined(entry.title) ?? '',
                        authors: extractAuthors(entry.author),
                        summary: toStringOrUndefined(entry.summary) ?? '',
                        published: toStringOrUndefined(entry.published) ?? '',
                        updated: toStringOrUndefined(entry.updated) ?? '',
                        categories: extractCategories(entry.category),
                        pdfUrl: findPdfUrl(entry.link),
                        doi: toStringOrUndefined(entry['arxiv:doi']),
                        comment: toStringOrUndefined(entry['arxiv:comment']),
                        journal_ref: toStringOrUndefined(
                            entry['arxiv:journal_ref']
                        ),
                    }
                }
            )

            voltlogger.info(
                `Found ${papers.length} papers for query: ${args.query}`
            )

            return {
                query: args.query,
                totalResults: papers.length,
                papers,
            }
        } catch (error) {
            voltlogger.error(`arXiv search failed: ${String(error)}`)
            throw new Error(`Failed to search arXiv: ${String(error)}`)
        }
    },
})

export const arxivPdfExtractTool = createTool({
    name: 'arxiv_pdf_extract',
    description:
        'Extract text content from an arXiv PDF URL using the pdf-parse library.',
    parameters: z.object({
        pdfUrl: z
            .url()
            .describe(
                'The PDF URL from arXiv (must be a valid arXiv PDF link)'
            ),
        maxPages: z
            .number()
            .min(1)
            .max(50)
            .default(10)
            .describe('Maximum number of pages to extract (1-50)'),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error('Operation has been cancelled')
        }

        voltlogger.info(`Extracting PDF content from: ${args.pdfUrl}`)

        try {
            // Validate arXiv URL (must be a PDF hosted on arxiv.org)
            try {
                const parsed = new URL(args.pdfUrl)
                if (
                    !parsed.hostname.endsWith('arxiv.org') ||
                    !parsed.pathname.endsWith('.pdf')
                ) {
                    throw new Error(
                        'Invalid arXiv PDF URL. Must be a PDF link from arxiv.org'
                    )
                }
            } catch {
                throw new Error(
                    'Invalid arXiv PDF URL. Must be a PDF link from arxiv.org'
                )
            }

            // Fetch PDF
            const response = await fetch(args.pdfUrl)
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch PDF: ${response.status} ${response.statusText}`
                )
            }

            const pdfBuffer = await response.arrayBuffer()
            const buf = new Uint8Array(pdfBuffer)

            // Use unpdf with dynamic import and typed wrappers to avoid `any`
            const unpdf = (await import('unpdf')) as {
                extractText: (input: Uint8Array) => Promise<unknown>
                getMeta: (input: Uint8Array) => Promise<unknown>
            }

            const rawText: unknown = await unpdf.extractText(buf)
            const rawMeta: unknown = await unpdf.getMeta(buf)

            // Helpers for robust type narrowing
            const isObject = (v: unknown): v is Record<string, unknown> =>
                v !== null && typeof v === 'object' && !Array.isArray(v)

            const getProp = <T = unknown>(
                obj: unknown,
                key: string
            ): T | undefined => {
                if (!isObject(obj)) {
                    return undefined
                }
                return obj[key] as T | undefined
            }

            const toStringOrUndefined = (v: unknown): string | undefined => {
                if (typeof v === 'string') {
                    return v
                }
                if (v === null || v === undefined) {
                    return undefined
                }
                return safeStringify(v)
            }

            const parseNumber = (v: unknown): number | undefined => {
                if (typeof v === 'number' && Number.isFinite(v)) {
                    return Math.trunc(v)
                }
                if (typeof v === 'string') {
                    const parsed = parseInt(v, 10)
                    return Number.isFinite(parsed) ? parsed : undefined
                }
                return undefined
            }

            // Determine number of pages from several possible shapes returned by getMeta()
            let numpages = 0
            if (isObject(rawMeta)) {
                const m = rawMeta
                const candidates: unknown[] = []

                if ('totalPages' in m) {
                    candidates.push(m.totalPages)
                }
                if ('pages' in m) {
                    candidates.push(m.pages)
                }
                if ('numPages' in m) {
                    candidates.push(m.numPages)
                }

                const mm = getProp<Record<string, unknown>>(m, 'metadata')
                if (isObject(mm)) {
                    if ('pages' in mm) {
                        candidates.push(mm.pages)
                    }
                    if ('numPages' in mm) {
                        candidates.push(mm.numPages)
                    }
                }

                const mi = getProp<Record<string, unknown>>(m, 'info')
                if (isObject(mi)) {
                    if ('Pages' in mi) {
                        candidates.push(mi.Pages)
                    }
                }

                for (const candidate of candidates) {
                    const extracted = parseNumber(candidate)
                    if (extracted !== undefined) {
                        numpages = extracted
                        break
                    }
                }
            }

            // Normalize text: extractText may return a string, an array, or an object with a text field
            const normalizedText = (() => {
                if (typeof rawText === 'string') {
                    return rawText
                }

                if (Array.isArray(rawText)) {
                    const strs = (rawText as unknown[]).filter(
                        (el): el is string => typeof el === 'string'
                    )
                    if (strs.length > 0) {
                        return strs.join('\n\n')
                    }
                }

                if (isObject(rawText)) {
                    const tField = getProp<unknown>(rawText, 'text')
                    if (typeof tField === 'string') {
                        return tField
                    }
                    if (Array.isArray(tField)) {
                        const strs = (tField as unknown[]).filter(
                            (el): el is string => typeof el === 'string'
                        )
                        if (strs.length > 0) {
                            return strs.join('\n\n')
                        }
                    }
                }

                // Fallback to a safe string representation
                return safeStringify(rawText)
            })()

            const infoSource = (() => {
                if (!isObject(rawMeta)) {
                    return undefined
                }
                const m = rawMeta
                const topInfo = getProp<Record<string, unknown>>(m, 'info')
                if (isObject(topInfo)) {
                    return topInfo
                }
                const mm = getProp<Record<string, unknown>>(m, 'metadata')
                if (isObject(mm)) {
                    const nestedInfo = getProp<Record<string, unknown>>(
                        mm,
                        'info'
                    )
                    if (isObject(nestedInfo)) {
                        return nestedInfo
                    }
                }
                return undefined
            })()

            const data: PdfParseResult = {
                numpages,
                text: normalizedText,
                info: {
                    Title: toStringOrUndefined(getProp(infoSource, 'Title')),
                    Author: toStringOrUndefined(getProp(infoSource, 'Author')),
                    Subject: toStringOrUndefined(
                        getProp(infoSource, 'Subject')
                    ),
                    Creator: toStringOrUndefined(
                        getProp(infoSource, 'Creator')
                    ),
                },
                hasEOL: normalizedText.includes('\n'),
            }

            voltlogger.info(`Extracted ${data.numpages} pages from PDF`)

            return {
                pdfUrl: args.pdfUrl,
                totalPages: data.numpages,
                extractedPages: Math.min(data.numpages, args.maxPages),
                text: data.text,
                info: {
                    title: data.info?.Title,
                    author: data.info?.Author,
                    subject: data.info?.Subject,
                    creator: data.info?.Creator,
                },
            }
        } catch (error) {
            voltlogger.error(`PDF extraction failed: ${String(error)}`)
            throw new Error(`Failed to extract PDF content: ${String(error)}`)
        }
    },
})

export const arxivToolkit = createToolkit({
    name: 'arxiv_toolkit',
    description:
        'Tools for searching and extracting content from arXiv academic papers.',
    instructions: `Use these tools to search for academic papers on arXiv and extract their content. The search tool uses arXiv's query syntax - you can search by title (ti:), author (au:), abstract (abs:), or general terms. The PDF extraction tool uses the pdf-parse library to extract text from up to 50 pages.`,
    addInstructions: true,
    tools: [arxivSearchTool, arxivPdfExtractTool] as unknown as Tool[],
})

// Use JSON.stringify with circular detection to avoid default "[object Object]" output
const safeStringify = (value: unknown): string => {
    const seen = new WeakSet<object>()
    try {
        return (
            JSON.stringify(value, (_k, v) => {
                if (Boolean(v) && typeof v === 'object') {
                    const objVal = v as object
                    if (seen.has(objVal)) {
                        return '[Circular]'
                    }
                    seen.add(objVal)
                }
                if (typeof v === 'function' || typeof v === 'symbol') {
                    return String(v)
                }
                return v as unknown
            }) ?? Object.prototype.toString.call(value)
        )
    } catch {
        // Fallback to a stable, informative descriptor
        return Object.prototype.toString.call(value)
    }
}
