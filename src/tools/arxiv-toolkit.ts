import { createTool, createToolkit } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"
import { XMLParser } from "fast-xml-parser"
import type { TextItem } from "pdfjs-dist/types/src/display/api.js"

// Types for arXiv API response
interface ArxivEntry {
  id: string
  title: string
  author: { name: string } | Array<{ name: string }>
  summary: string
  published: string
  updated: string
  category: { "@_term": string } | Array<{ "@_term": string }>
  link: Array<{ "@_title"?: string; "@_rel"?: string; "@_type"?: string; "@_href": string }>
  "arxiv:doi"?: string
  "arxiv:comment"?: string
  "arxiv:journal_ref"?: string
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
  name: "arxiv_search",
  description: "Search arXiv for academic papers using the arXiv API. Returns paper metadata including titles, authors, abstracts, and PDF links.",
  parameters: z.object({
    query: z.string().describe("Search query using arXiv syntax (e.g., 'machine learning' or 'ti:machine learning' for title search)"),
    maxResults: z.number().min(1).max(100).default(10).describe("Maximum number of results to return (1-100)"),
    sortBy: z.enum(["relevance", "submittedDate", "lastUpdatedDate"]).default("relevance").describe("Sort results by relevance, submission date, or last updated date"),
    sortOrder: z.enum(["ascending", "descending"]).default("descending").describe("Sort order"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Searching arXiv for: ${args.query}`)

    try {
      // Build arXiv API query
      const baseUrl = "http://export.arxiv.org/api/query"
      const params = new URLSearchParams({
        search_query: args.query,
        max_results: args.maxResults.toString(),
        sortBy: args.sortBy === "relevance" ? "relevance" :
          args.sortBy === "submittedDate" ? "submittedDate" : "lastUpdatedDate",
        sortOrder: args.sortOrder,
      })

      const response = await fetch(`${baseUrl}?${params}`)
      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status} ${response.statusText}`)
      }

      const xmlText = await response.text()

      // Parse XML response
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      })

      const result = parser.parse(xmlText) as ArxivFeed

      // Extract entries
      const feed = result.feed
      const entries: ArxivEntry[] = Array.isArray(feed.entry) ? feed.entry : [feed.entry]

      // Helper: normalize value that may be string or single-element array
      const toStringOrUndefined = (v: unknown): string | undefined => {
        if (typeof v === "string") { return v }
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") { return v[0] }
        return undefined
      }

      // Helper: extract authors from ArxivEntry author field
      const extractAuthors = (authorField: ArxivEntry["author"]): string[] => {
        if (!authorField) { return [] }
        if (Array.isArray(authorField)) {
          return authorField
            .map(a => toStringOrUndefined(a.name))
            .filter(Boolean) as string[]
        }
        const name = toStringOrUndefined(authorField.name)
        return name ? [name] : []
      }

      // Helper: extract categories from ArxivEntry category field
      const extractCategories = (catField: ArxivEntry["category"]): string[] => {
        if (!catField) { return [] }
        if (Array.isArray(catField)) {
          return catField
            .map(c => toStringOrUndefined(c["@_term"]))
            .filter(Boolean) as string[]
        }
        const term = toStringOrUndefined(catField["@_term"])
        return term ? [term] : []
      }

      // Helper: find PDF URL from ArxivEntry link field
      const findPdfUrl = (linkField: ArxivEntry["link"]): string | undefined => {
        if (!linkField) { return undefined }
        const links = Array.isArray(linkField) ? linkField : [linkField]

        const pdfByTitle = links.find(l => toStringOrUndefined(l["@_title"]) === "pdf")
        if (pdfByTitle) { return toStringOrUndefined(pdfByTitle["@_href"]) }

        const pdfByRel = links.find(l =>
          toStringOrUndefined(l["@_rel"]) === "alternate" &&
          toStringOrUndefined(l["@_type"]) === "application/pdf"
        )
        return pdfByRel ? toStringOrUndefined(pdfByRel["@_href"]) : undefined
      }

      const papers: ProcessedPaper[] = entries.map((entry: ArxivEntry) => {
        return {
          id: toStringOrUndefined(entry.id) ?? "",
          title: toStringOrUndefined(entry.title) ?? "",
          authors: extractAuthors(entry.author),
          summary: toStringOrUndefined(entry.summary) ?? "",
          published: toStringOrUndefined(entry.published) ?? "",
          updated: toStringOrUndefined(entry.updated) ?? "",
          categories: extractCategories(entry.category),
          pdfUrl: findPdfUrl(entry.link),
          doi: toStringOrUndefined(entry["arxiv:doi"]),
          comment: toStringOrUndefined(entry["arxiv:comment"]),
          journal_ref: toStringOrUndefined(entry["arxiv:journal_ref"]),
        }
      })

      voltlogger.info(`Found ${papers.length} papers for query: ${args.query}`)

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
  name: "arxiv_pdf_extract",
  description: "Extract text content from an arXiv PDF URL using the pdf-parse library.",
  parameters: z.object({
    pdfUrl: z.url().describe("The PDF URL from arXiv (must be a valid arXiv PDF link)"),
    maxPages: z.number().min(1).max(50).default(10).describe("Maximum number of pages to extract (1-50)"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Extracting PDF content from: ${args.pdfUrl}`)

    try {
      // Validate arXiv URL
      if (!args.pdfUrl.includes("arxiv.org") || !args.pdfUrl.includes(".pdf")) {
        throw new Error("Invalid arXiv PDF URL. Must be a PDF link from arxiv.org")
      }

      // Fetch PDF
      const response = await fetch(args.pdfUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
      }

      const pdfBuffer = await response.arrayBuffer()

      // Use pdfjs-dist with dynamic import
      const { getDocument } = await import('pdfjs-dist')

      const pdf = await getDocument({ data: new Uint8Array(pdfBuffer) }).promise

      let text = ''
      const maxPagesToExtract = Math.min(pdf.numPages, args.maxPages)

      for (let i = 1; i <= maxPagesToExtract; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is TextItem => 'str' in item)
          .map((item) => item.str)
          .join(' ');
        text += pageText + '\n\n';
      }

      const metadata = await pdf.getMetadata()

      // Guard the unknown shape returned by the PDF library and ensure string|undefined values
      const metaInfo = metadata.info as Record<string, unknown> | undefined
      const toStringOrUndefined = (v: unknown): string | undefined => {
        if (typeof v === 'string') {return v}
        if (v === null) {return undefined}
        return safeStringify(v)
      }

      const data: PdfParseResult = {
        numpages: pdf.numPages,
        text,
        info: {
          Title: toStringOrUndefined(metaInfo?.Title),
          Author: toStringOrUndefined(metaInfo?.Author),
          Subject: toStringOrUndefined(metaInfo?.Subject),
          Creator: toStringOrUndefined(metaInfo?.Creator),
        }
      }

      // Extract text from specified number of pages
      const extractedText = text

      voltlogger.info(`Extracted ${maxPagesToExtract} pages from PDF`)

      return {
        pdfUrl: args.pdfUrl,
        totalPages: data.numpages,
        extractedPages: args.maxPages,
        text: extractedText,
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
  name: "arxiv_toolkit",
  description: "Tools for searching and extracting content from arXiv academic papers.",
  instructions: `Use these tools to search for academic papers on arXiv and extract their content. The search tool uses arXiv's query syntax - you can search by title (ti:), author (au:), abstract (abs:), or general terms. The PDF extraction tool uses the pdf-parse library to extract text from up to 50 pages.`,
  addInstructions: true,
  tools: [arxivSearchTool, arxivPdfExtractTool],
})

// Use JSON.stringify with circular detection to avoid default "[object Object]" output
const safeStringify = (value: unknown): string => {
    const seen = new WeakSet<object>()
    try {
        return JSON.stringify(value, (_k, v) => {
            if ((Boolean(v)) && typeof v === 'object') {
                const objVal = v as object
                if (seen.has(objVal)) {return '[Circular]'}
                seen.add(objVal)
            }
            if (typeof v === 'function' || typeof v === 'symbol') {return String(v)}
            return v as unknown
        }) ?? Object.prototype.toString.call(value)
    } catch {
        // Fallback to a stable, informative descriptor
        return Object.prototype.toString.call(value)
    }
}
