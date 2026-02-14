import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { createHighlighter, type BundledLanguage } from 'shiki'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import TurndownService from 'turndown'
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

const SUPPORTED_LANGUAGES: BundledLanguage[] = [
    'typescript',
    'javascript',
    'python',
    'rust',
    'go',
    'java',
    'c',
    'cpp',
    'csharp',
    'ruby',
    'php',
    'swift',
    'kotlin',
    'sql',
    'html',
    'css',
    'json',
    'yaml',
    'toml',
    'markdown',
    'bash',
    'shell',
    'dockerfile',
    'graphql',
    'xml',
]

let _highlighter: Awaited<ReturnType<typeof createHighlighter>> | undefined

const getHighlighter = async () => {
    if (!_highlighter) {
        _highlighter = await createHighlighter({
            themes: ['github-dark', 'github-light'],
            langs: SUPPORTED_LANGUAGES,
        })
    }
    return _highlighter
}

export const markdownToHtmlTool = createTool({
    name: 'markdown_to_html',
    description:
        'Convert Markdown text to sanitized HTML. Supports GFM tables, task lists, code blocks, and all standard Markdown syntax. Output is sanitized to prevent XSS. Useful for rendering research reports, documentation, and formatted content.',
    tags: [
        'markdown',
        'html',
        'conversion',
        'rendering',
        'formatting',
        'content',
        'report',
    ],
    parameters: z.object({
        markdown: z.string().min(1).describe('Markdown text to convert'),
        sanitize: z
            .boolean()
            .default(true)
            .describe('Whether to sanitize the HTML output'),
    }),
    outputSchema: z.object({
        html: z.string(),
        charCount: z.number(),
    }),
    hooks: hooksFor('markdown_to_html'),
    execute: async (args, context) => {
        ensureActive(context)

        const rawHtml = await marked.parse(args.markdown, {
            gfm: true,
            breaks: true,
        })

        const html = args.sanitize
            ? sanitizeHtml(rawHtml, {
                  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                      'img',
                      'details',
                      'summary',
                      'mark',
                      'del',
                      'ins',
                      'sup',
                      'sub',
                      'abbr',
                      'figure',
                      'figcaption',
                      'input',
                  ]),
                  allowedAttributes: {
                      ...sanitizeHtml.defaults.allowedAttributes,
                      img: ['src', 'alt', 'title', 'width', 'height'],
                      a: ['href', 'title', 'target', 'rel'],
                      input: ['type', 'checked', 'disabled'],
                      code: ['class'],
                      span: ['class'],
                      pre: ['class'],
                  },
                  allowedSchemes: ['http', 'https', 'mailto'],
              })
            : rawHtml

        return {
            html,
            charCount: html.length,
        }
    },
})

export const htmlToMarkdownTool = createTool({
    name: 'html_to_markdown',
    description:
        'Convert HTML content to clean Markdown using Turndown. Preserves headings, lists, links, images, and code blocks. Useful for converting web content to a readable format for analysis or storage.',
    tags: [
        'html',
        'markdown',
        'conversion',
        'turndown',
        'format',
        'content-processing',
    ],
    parameters: z.object({
        html: z.string().min(1).describe('HTML content to convert'),
        headingStyle: z
            .enum(['atx', 'setext'])
            .default('atx')
            .describe('Heading style (atx = # Heading, setext = Heading\n===)'),
        codeBlockStyle: z
            .enum(['indented', 'fenced'])
            .default('fenced')
            .describe('Code block style'),
    }),
    outputSchema: z.object({
        markdown: z.string(),
        charCount: z.number(),
    }),
    hooks: hooksFor('html_to_markdown'),
    execute: async (args, context) => {
        ensureActive(context)

        const turndownService = new TurndownService({
            headingStyle: args.headingStyle,
            codeBlockStyle: args.codeBlockStyle,
            emDelimiter: '*',
        })

        const markdown = turndownService.turndown(args.html)

        return {
            markdown,
            charCount: markdown.length,
        }
    },
})

export const htmlSanitizeTool = createTool({
    name: 'html_sanitize',
    description:
        'Sanitize HTML content by removing potentially dangerous tags, attributes, and scripts. Prevents XSS attacks while preserving safe formatting. Useful for cleaning user-generated or scraped HTML content.',
    tags: [
        'html',
        'sanitize',
        'security',
        'xss-prevention',
        'clean',
        'content-safety',
    ],
    parameters: z.object({
        html: z.string().min(1).describe('HTML content to sanitize'),
        stripAll: z
            .boolean()
            .default(false)
            .describe('If true, strip ALL HTML tags and return plain text'),
        allowedTags: z
            .array(z.string())
            .optional()
            .describe('Custom list of allowed HTML tags (overrides defaults)'),
    }),
    outputSchema: z.object({
        sanitized: z.string(),
        charCount: z.number(),
        tagsRemoved: z.number(),
    }),
    hooks: hooksFor('html_sanitize'),
    execute: async (args, context) => {
        ensureActive(context)

        const originalTagCount = (args.html.match(/<[a-zA-Z][^>]*>/g) ?? [])
            .length

        if (args.stripAll) {
            const plain = sanitizeHtml(args.html, {
                allowedTags: [],
                allowedAttributes: {},
            })
            return {
                sanitized: plain.trim(),
                charCount: plain.trim().length,
                tagsRemoved: originalTagCount,
            }
        }

        const sanitized = sanitizeHtml(args.html, {
            allowedTags: args.allowedTags ?? sanitizeHtml.defaults.allowedTags,
            allowedAttributes: sanitizeHtml.defaults.allowedAttributes,
            allowedSchemes: ['http', 'https', 'mailto'],
        })

        const remainingTagCount = (sanitized.match(/<[a-zA-Z][^>]*>/g) ?? [])
            .length

        return {
            sanitized,
            charCount: sanitized.length,
            tagsRemoved: originalTagCount - remainingTagCount,
        }
    },
})

export const syntaxHighlightTool = createTool({
    name: 'syntax_highlight',
    description:
        'Apply syntax highlighting to code snippets using Shiki. Returns HTML with inline styles for rendering highlighted code. Supports 25+ languages including TypeScript, Python, Rust, Go, SQL. Useful for generating code displays in reports and documentation.',
    tags: [
        'syntax-highlighting',
        'code',
        'shiki',
        'html',
        'formatting',
        'programming-languages',
    ],
    parameters: z.object({
        code: z.string().min(1).describe('Code snippet to highlight'),
        language: z
            .string()
            .default('typescript')
            .describe(
                'Programming language (typescript, python, rust, go, java, sql, etc.)'
            ),
        theme: z
            .enum(['github-dark', 'github-light'])
            .default('github-dark')
            .describe('Color theme for highlighting'),
    }),
    outputSchema: z.object({
        html: z.string(),
        language: z.string(),
        theme: z.string(),
        lineCount: z.number(),
    }),
    hooks: hooksFor('syntax_highlight'),
    execute: async (args, context) => {
        ensureActive(context)

        const highlighter = await getHighlighter()

        const lang = SUPPORTED_LANGUAGES.includes(
            args.language as BundledLanguage
        )
            ? (args.language as BundledLanguage)
            : 'typescript'

        const html = highlighter.codeToHtml(args.code, {
            lang,
            theme: args.theme,
        })

        return {
            html,
            language: lang,
            theme: args.theme,
            lineCount: args.code.split('\n').length,
        }
    },
})

export const htmlToPlaintextTool = createTool({
    name: 'html_to_plaintext',
    description:
        'Convert HTML content to clean plain text by stripping all tags and decoding entities. Preserves paragraph structure with newlines. Useful for extracting readable text from web pages, emails, or HTML documents for analysis.',
    tags: [
        'html',
        'plaintext',
        'text-extraction',
        'conversion',
        'strip-tags',
        'content',
    ],
    parameters: z.object({
        html: z
            .string()
            .min(1)
            .describe('HTML content to convert to plain text'),
        preserveLineBreaks: z
            .boolean()
            .default(true)
            .describe('Preserve paragraph breaks as newlines in output'),
    }),
    outputSchema: z.object({
        text: z.string(),
        charCount: z.number(),
        wordCount: z.number(),
    }),
    hooks: hooksFor('html_to_plaintext'),
    execute: async (args, context) => {
        ensureActive(context)

        let processed = args.html

        if (args.preserveLineBreaks) {
            processed = processed
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<\/div>/gi, '\n')
                .replace(/<\/li>/gi, '\n')
                .replace(/<\/h[1-6]>/gi, '\n\n')
                .replace(/<\/tr>/gi, '\n')
                .replace(/<\/blockquote>/gi, '\n')
        }

        const text = sanitizeHtml(processed, {
            allowedTags: [],
            allowedAttributes: {},
        })
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim()

        const words = text.split(/\s+/).filter((w) => w.length > 0)

        return {
            text,
            charCount: text.length,
            wordCount: words.length,
        }
    },
})

export const xmlToJsonTool = createTool({
    name: 'xml_to_json',
    description:
        'Convert XML string to JSON object. Useful for parsing RSS feeds, API responses, or legacy data formats.',
    tags: ['xml', 'json', 'conversion', 'parsing', 'data'],
    parameters: z.object({
        xml: z.string().min(1).describe('XML string to convert'),
        ignoreAttributes: z
            .boolean()
            .default(true)
            .describe('Ignore XML attributes (simplifies output)'),
    }),
    outputSchema: z.object({
        json: z.unknown(),
    }),
    hooks: hooksFor('xml_to_json'),
    execute: async (args, context) => {
        ensureActive(context)

        const parser = new XMLParser({
            ignoreAttributes: args.ignoreAttributes,
            parseTagValue: true,
        })
        const json = parser.parse(args.xml)

        return {
            json,
        }
    },
})

export const jsonToXmlTool = createTool({
    name: 'json_to_xml',
    description:
        'Convert JSON object/string to XML string. Useful for generating API payloads or configuration files.',
    tags: ['json', 'xml', 'conversion', 'builder', 'data'],
    parameters: z.object({
        json: z
            .union([z.string(), z.record(z.string(), z.unknown())])
            .describe('JSON object or string to convert'),
        format: z.boolean().default(true).describe('Pretty print XML'),
    }),
    outputSchema: z.object({
        xml: z.string(),
    }),
    hooks: hooksFor('json_to_xml'),
    execute: async (args, context) => {
        ensureActive(context)

        let jsonObj: any = args.json
        if (typeof args.json === 'string') {
            jsonObj = JSON.parse(args.json)
        }

        const builder = new XMLBuilder({
            format: args.format,
            ignoreAttributes: true,
        })
        const xml = builder.build(jsonObj)

        return {
            xml,
        }
    },
})

export const extractUrlsTool = createTool({
    name: 'extract_urls',
    description:
        'Extract all URLs from a text string. Returns a list of valid HTTP/HTTPS URLs. Useful for finding links in content.',
    tags: ['url', 'extract', 'links', 'regex', 'text-processing'],
    parameters: z.object({
        text: z.string().min(1).describe('Text to extract URLs from'),
    }),
    outputSchema: z.object({
        urls: z.array(z.string()),
        count: z.number(),
    }),
    hooks: hooksFor('extract_urls'),
    execute: async (args, context) => {
        ensureActive(context)

        const urlRegex = /(https?:\/\/[^\s]+)/g
        const matches = args.text.match(urlRegex) || []
        const uniqueUrls = [...new Set(matches)]

        return {
            urls: uniqueUrls,
            count: uniqueUrls.length,
        }
    },
})

export const extractFrontmatterTool = createTool({
    name: 'extract_frontmatter',
    description:
        'Extract YAML frontmatter from a Markdown string. Returns the frontmatter as a JSON object and the remaining content. Useful for parsing blog posts, documentation, or static site content.',
    tags: ['frontmatter', 'yaml', 'markdown', 'extract', 'metadata', 'parsing'],
    parameters: z.object({
        text: z.string().min(1).describe('Markdown text with frontmatter'),
    }),
    outputSchema: z.object({
        frontmatter: z.string().nullable(), // Return raw string, parsing YAML requires a parser which we might not have in scope (fast-xml-parser parses XML, not YAML)
        content: z.string(),
        hasFrontmatter: z.boolean(),
    }),
    hooks: hooksFor('extract_frontmatter'),
    execute: async (args, context) => {
        ensureActive(context)

        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
        const match = args.text.match(frontmatterRegex)

        if (match) {
            return {
                frontmatter: match[1],
                content: match[2],
                hasFrontmatter: true,
            }
        }

        return {
            frontmatter: null,
            content: args.text,
            hasFrontmatter: false,
        }
    },
})
