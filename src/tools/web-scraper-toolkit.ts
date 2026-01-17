import { createTool, createToolkit, type Toolkit } from "@voltagent/core"
import type { ToolExecuteOptions } from "@voltagent/core"
import { z } from "zod"
import { JSDOM } from "jsdom"
import * as cheerio from "cheerio"
import TurndownService from "turndown"
import { voltlogger } from "../config/logger.js"

const turndownService = new TurndownService({
	headingStyle: "atx",
	bulletListMarker: "-",
	codeBlockStyle: "fenced",
})

export const webScraperToolkit: Toolkit = createToolkit({
	name: "web_scraper_toolkit",
	description:
		"Comprehensive web scraping toolkit for extracting and processing content from webpages. Includes tools for converting to Markdown, extracting code blocks with context, pulling structured data, and getting clean text content.",
	instructions: `
Use these web scraping tools to extract and process content from websites:

1. **scrape_webpage_markdown**: Use when you need the full webpage content converted to clean, well-formatted Markdown. Perfect for documentation, articles, and reference materials.

2. **extract_code_blocks**: Use when you specifically need to find and extract code examples from a webpage. Gets code with surrounding context for better understanding.

3. **extract_structured_data**: Use when you need to understand page structure or extract specific information like headings, links, tables, and lists in a structured format.

4. **extract_text_content**: Use when you need just the plain text content without any formatting or HTML. Good for reading articles and documents.

Tips:
- Always check if the operation is active before processing large pages
- Use structured data extraction to first understand page layout before deep processing
- For documentation sites, combine Markdown extraction with code block extraction for complete information
- Respect robots.txt and website terms of service when scraping
	`,
	addInstructions: true,
	tools: [
		createTool({
			name: "scrape_webpage_markdown",
			description:
				"Scrapes a complete webpage and converts it to clean, well-formatted Markdown. Preserves structure, links, images, and formatting.",
			parameters: z.object({
				url: z.url().describe("The URL of the webpage to scrape"),
				removeScripts: z
					.boolean()
					.optional()
					.default(true)
					.describe("Remove script tags and navigation elements (default: true)"),
				includeImages: z
					.boolean()
					.optional()
					.default(true)
					.describe("Include image markdown with alt text (default: true)"),
				maxLength: z
					.number()
					.positive()
					.optional()
					.describe("Maximum length of content in characters. If exceeded, content will be truncated."),
			}),
			execute: async (args, context?: ToolExecuteOptions) => {
				if (!context?.isActive) {
					throw new Error("Operation has been cancelled")
				}

				try {
					voltlogger.info(`Scraping webpage: ${args.url}`, {
						operationId: context?.operationId,
					})

					const response = await fetch(args.url, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
						},
					})

					if (!response.ok) {
						throw new Error(`Failed to fetch URL: ${response.statusText}`)
					}

					const html = await response.text()
					const dom = new JSDOM(html, { url: args.url })
					const document = dom.window.document

					if (args.removeScripts) {
						document.querySelectorAll("script, style, noscript, nav, footer").forEach((el) => {
							el.remove()
						})
					}

					const content = document.querySelector("main, article, .content, #content, body") || document.body
					let htmlContent = content.innerHTML

					if (!args.includeImages) {
						htmlContent = htmlContent.replace(/<img[^>]*>/g, "")
					}

					const markdown = turndownService.turndown(htmlContent)

					let finalMarkdown = markdown.trim()

					if (args.maxLength && finalMarkdown.length > args.maxLength) {
						finalMarkdown = finalMarkdown.substring(0, args.maxLength) + "\n\n[... content truncated ...]"
					}

					voltlogger.info(`Successfully scraped webpage: ${args.url}`, {
						operationId: context?.operationId,
						contentLength: finalMarkdown.length,
					})

					return {
						url: args.url,
						markdown: finalMarkdown,
						contentLength: finalMarkdown.length,
						scrapedAt: new Date().toISOString(),
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					voltlogger.error(`Webpage scraping failed: ${errorMessage}`, {
						operationId: context?.operationId,
						url: args.url,
					})
					throw new Error(`Failed to scrape webpage: ${errorMessage}`)
				}
			},
		}),
		createTool({
			name: "extract_code_blocks",
			description:
				"Extracts all code blocks from a webpage along with their context (surrounding text, language, file references). Perfect for finding code examples and documentation.",
			parameters: z.object({
				url: z.url().describe("The URL of the webpage to extract code blocks from"),
				includeContext: z
					.boolean()
					.optional()
					.default(true)
					.describe("Include surrounding text context for each code block (default: true)"),
				contextLines: z
					.number()
					.min(1)
					.max(20)
					.optional()
					.default(3)
					.describe("Number of lines before and after each code block to include as context"),
			}),
			execute: async (args, context?: ToolExecuteOptions) => {
				if (!context?.isActive) {
					throw new Error("Operation has been cancelled")
				}

				try {
					voltlogger.info(`Extracting code blocks from: ${args.url}`, {
						operationId: context?.operationId,
					})

					const response = await fetch(args.url, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
						},
					})

					if (!response.ok) {
						throw new Error(`Failed to fetch URL: ${response.statusText}`)
					}

					const html = await response.text()
					const $ = cheerio.load(html)

					const codeBlocks: Array<{
						language: string
						code: string
						context?: string
						filename?: string
						index: number
						elementIndex: number
					}> = []

					let blockIndex = 0

					$("pre, code").each((idx, element) => {
						const $el = $(element)
						let code = ""
						let language = "plaintext"

						if ($el.is("pre")) {
							const $code = $el.find("code").first()
							code = $code.length > 0 ? $code.text() : $el.text()
							const classAttr = $code.attr("class") ?? $el.attr("class")
							if (classAttr) {
								const match = /language-(\w+)/.exec(classAttr)
								language = match ? match[1] : "plaintext"
							}
						} else if ($el.is("code")) {
							code = $el.text()
							const classAttr = $el.attr("class")
							if (classAttr) {
								const match = /language-(\w+)/.exec(classAttr)
								language = match ? match[1] : "plaintext"
							}
						}

						if (code.trim()) {
							const blockInfo: (typeof codeBlocks)[0] = {
								language,
								code: code.trim(),
								index: blockIndex++,
								elementIndex: idx,
							}

							if (args.includeContext) {
								const beforeLines = []
								const afterLines = []

								let current = $el
								let collectedBefore = 0
								for (let i = 0; i < args.contextLines; i++) {
									const prev = current.prev()
									if (prev.length > 0) {
										beforeLines.unshift(prev.text())
										current = prev
										collectedBefore++
									} else {
										break
									}
								}

								current = $el
								let collectedAfter = 0
								for (let i = 0; i < args.contextLines; i++) {
									const next = current.next()
									if (next.length > 0) {
										afterLines.push(next.text())
										current = next
										collectedAfter++
									} else {
										break
									}
								}

								blockInfo.context = [
									...beforeLines.slice(-args.contextLines),
									...afterLines.slice(0, args.contextLines),
								]
									.filter((l) => l.trim())
									.join("\n")

								// Log context collection stats
								voltlogger.debug(`Context collected: ${collectedBefore} before, ${collectedAfter} after lines`, {
									operationId: context?.operationId,
									requested: args.contextLines,
								})
							}

							const filenameAttr =
								$el.attr("data-filename") ||
								$el.parent().attr("data-filename") ||
								$el.find("[data-filename]").first().attr("data-filename")

							if (filenameAttr) {
								blockInfo.filename = filenameAttr
							}

							codeBlocks.push(blockInfo)
						}
					})

					voltlogger.info(`Extracted ${codeBlocks.length} code blocks`, {
						operationId: context?.operationId,
					})

					return {
						url: args.url,
						totalCodeBlocks: codeBlocks.length,
						codeBlocks,
						extractedAt: new Date().toISOString(),
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					voltlogger.error(`Code block extraction failed: ${errorMessage}`, {
						operationId: context?.operationId,
						url: args.url,
					})
					throw new Error(`Failed to extract code blocks: ${errorMessage}`)
				}
			},
		}),
		createTool({
			name: "extract_structured_data",
			description:
				"Extracts structured data from a webpage including headings, links, tables, lists, and metadata. Useful for understanding page structure and extracting specific information.",
			parameters: z.object({
				url: z.url().describe("The URL of the webpage to analyze"),
				includeMetadata: z
					.boolean()
					.optional()
					.default(true)
					.describe("Include page metadata (title, description, keywords) (default: true)"),
				includeLinks: z
					.boolean()
					.optional()
					.default(true)
					.describe("Include all links from the page (default: true)"),
				includeTables: z
					.boolean()
					.optional()
					.default(true)
					.describe("Extract table data in structured format (default: true)"),
			}),
			execute: async (args, context?: ToolExecuteOptions) => {
				if (!context?.isActive) {
					throw new Error("Operation has been cancelled")
				}

				try {
					voltlogger.info(`Extracting structured data from: ${args.url}`, {
						operationId: context?.operationId,
					})

					const response = await fetch(args.url, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
						},
					})

					if (!response.ok) {
						throw new Error(`Failed to fetch URL: ${response.statusText}`)
					}

					const html = await response.text()
					const $ = cheerio.load(html)

					const data: {
						url: string
						metadata?: {
							title: string
							description?: string
							keywords?: string
							author?: string
						}
						headings?: Array<{ level: number; text: string; index: number }>
						links?: Array<{ text: string; href: string; title?: string; index: number }>
						tables?: Array<{
							headers: string[]
							rows: string[][]
							index: number
							headerCount: number
							rowCount: number
						}>
						lists?: Array<{
							type: "ordered" | "unordered"
							items: string[]
							index: number
							itemCount: number
						}>
					} = {
						url: args.url,
					}

					if (args.includeMetadata) {
						data.metadata = {
							title: $("title").text() || "",
							description: $('meta[name="description"]').attr("content"),
							keywords: $('meta[name="keywords"]').attr("content"),
							author: $('meta[name="author"]').attr("content"),
						}
					}

					const headings: Array<{ level: number; text: string; index: number }> = []
					$("h1, h2, h3, h4, h5, h6").each((idx, el) => {
						const $el = $(el)
						const level = parseInt(el.name.substring(1))
						headings.push({
							level,
							text: $el.text().trim(),
							index: idx,
						})
					})
					if (headings.length > 0) {
						data.headings = headings
					}

					if (args.includeLinks) {
						const links: Array<{ text: string; href: string; title?: string; index: number }> = []
						$("a[href]").each((idx, el) => {
							const $el = $(el)
							const href = $el.attr("href")
							if (href && !href.startsWith("#")) {
								links.push({
									text: $el.text().trim() || "Link",
									href,
									title: $el.attr("title"),
									index: idx,
								})
							}
						})
						if (links.length > 0) {
							data.links = links
						}
					}

					if (args.includeTables) {
						const tables: Array<{
							headers: string[]
							rows: string[][]
							index: number
							headerCount: number
							rowCount: number
						}> = []
						$("table").each((idx, el) => {
							const $table = $(el)
							const headers: string[] = []
							const rows: string[][] = []

							$table.find("thead tr th").each((headerIndex, cell) => {
								headers.push($(cell).text().trim())
								// Validate header index matches expected position
								if (headerIndex >= headers.length) {
									voltlogger.warn(`Header index mismatch at position ${headerIndex}`, {
										operationId: context?.operationId,
									})
								}
							})

							$table.find("tbody tr").each((rowIndex, row) => {
								const $row = $(row)
								const rowData: string[] = []
								$row.find("td").each((cellIndex, cell) => {
									rowData.push($(cell).text().trim())
									// Validate cell index within row
									if (cellIndex >= rowData.length) {
										voltlogger.warn(`Cell index mismatch in row ${rowIndex}, cell ${cellIndex}`, {
											operationId: context?.operationId,
										})
									}
								})
								if (rowData.length > 0) {
									rows.push(rowData)
									// Validate row has consistent cell count
									if (rows.length > 1 && rowData.length !== rows[rows.length - 2].length) {
										voltlogger.warn(`Inconsistent row length at row ${rowIndex}: expected ${rows[rows.length - 2].length}, got ${rowData.length}`, {
											operationId: context?.operationId,
										})
									}
								}
							})

							if (headers.length > 0 || rows.length > 0) {
								tables.push({
									headers: headers.length > 0 ? headers : rows[0] || [],
									rows: headers.length > 0 ? rows : rows.slice(1),
									index: idx,
									headerCount: headers.length,
									rowCount: rows.length,
								})
							}
						})
						if (tables.length > 0) {
							data.tables = tables
						}
					}

					const lists: Array<{
						type: "ordered" | "unordered"
						items: string[]
						index: number
						itemCount: number
					}> = []
					$("ol").each((idx, el) => {
						const items: string[] = []
						$(el)
							.find("> li")
							.each((itemIndex, li) => {
								const itemText = $(li).text().trim()
								if (itemText) {
									items.push(itemText)
									// Validate item index matches array position
									if (itemIndex !== items.length - 1) {
										voltlogger.warn(`Ordered list item index mismatch: expected ${items.length - 1}, got ${itemIndex}`, {
											operationId: context?.operationId,
										})
									}
								}
							})
						if (items.length > 0) {
							lists.push({
								type: "ordered",
								items,
								index: idx,
								itemCount: items.length,
							})
						}
					})
					$("ul").each((idx, el) => {
						const items: string[] = []
						$(el)
							.find("> li")
							.each((itemIndex, li) => {
								const itemText = $(li).text().trim()
								if (itemText) {
									items.push(itemText)
									// Validate item index matches array position
									if (itemIndex !== items.length - 1) {
										voltlogger.warn(`Unordered list item index mismatch: expected ${items.length - 1}, got ${itemIndex}`, {
											operationId: context?.operationId,
										})
									}
								}
							})
						if (items.length > 0) {
							lists.push({
								type: "unordered",
								items,
								index: idx,
								itemCount: items.length,
							})
						}
					})
					if (lists.length > 0) {
						data.lists = lists
					}

					voltlogger.info(`Extracted structured data from: ${args.url}`, {
						operationId: context?.operationId,
						headingsCount: data.headings?.length || 0,
						linksCount: data.links?.length || 0,
						tablesCount: data.tables?.length || 0,
						listsCount: data.lists?.length || 0,
					})

					return {
						...data,
						extractedAt: new Date().toISOString(),
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					voltlogger.error(`Structured data extraction failed: ${errorMessage}`, {
						operationId: context?.operationId,
						url: args.url,
					})
					throw new Error(`Failed to extract structured data: ${errorMessage}`)
				}
			},
		}),
		createTool({
			name: "extract_text_content",
			description:
				"Extracts clean, readable text content from a webpage. Removes HTML, scripts, styles, and navigation elements. Great for getting the main article or document text.",
			parameters: z.object({
				url: z.url().describe("The URL of the webpage to extract text from"),
				removeNavigation: z
					.boolean()
					.optional()
					.default(true)
					.describe("Remove navigation elements (default: true)"),
				cleanWhitespace: z
					.boolean()
					.optional()
					.default(true)
					.describe("Clean excessive whitespace and newlines (default: true)"),
			}),
			execute: async (args, context?: ToolExecuteOptions) => {
				if (!context?.isActive) {
					throw new Error("Operation has been cancelled")
				}

				try {
					voltlogger.info(`Extracting text content from: ${args.url}`, {
						operationId: context?.operationId,
					})

					const response = await fetch(args.url, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
						},
					})

					if (!response.ok) {
						throw new Error(`Failed to fetch URL: ${response.statusText}`)
					}

					const html = await response.text()
					const dom = new JSDOM(html, { url: args.url })
					const document = dom.window.document

					document.querySelectorAll("script, style, noscript").forEach((el) => {
						el.remove()
					})

					if (args.removeNavigation) {
						document.querySelectorAll("nav, footer, header").forEach((el) => {
							el.remove()
						})
					}

					let text = document.body.textContent || ""

					if (args.cleanWhitespace) {
						text = text
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line.length > 0)
							.join("\n")
							.replace(/\n{3,}/g, "\n\n")
					}

					voltlogger.info(`Successfully extracted text from: ${args.url}`, {
						operationId: context?.operationId,
						textLength: text.length,
					})

					return {
						url: args.url,
						text: text.trim(),
						textLength: text.length,
						extractedAt: new Date().toISOString(),
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					voltlogger.error(`Text extraction failed: ${errorMessage}`, {
						operationId: context?.operationId,
						url: args.url,
					})
					throw new Error(`Failed to extract text content: ${errorMessage}`)
				}
			},
		}),
		createTool({
			name: "batch_scrape_pages",
			description:
				"Performs batch scraping of multiple webpages with configurable depth. Can follow links recursively while respecting rate limits and depth constraints. Always extracts content as Markdown with embedded code blocks.",
			parameters: z.object({
				urls: z.array(z.url()).min(1).max(50).describe("Array of starting URLs to scrape (max 50)"),
				maxDepth: z
					.number()
					.min(1)
					.max(5)
					.optional()
					.default(1)
					.describe("Maximum depth to follow links (1 = only given URLs, 2 = follow links from given URLs, etc.)"),
				maxPages: z
					.number()
					.min(1)
					.max(100)
					.optional()
					.default(10)
					.describe("Maximum total pages to scrape across all URLs and depths"),
				followExternalLinks: z
					.boolean()
					.optional()
					.default(false)
					.describe("Whether to follow links to external domains"),
				delayMs: z
					.number()
					.min(100)
					.max(5000)
					.optional()
					.default(1000)
					.describe("Delay between requests in milliseconds (default: 1000ms)"),
				includePatterns: z
					.array(z.string())
					.optional()
					.describe("Regex patterns for URLs to include (if specified, only matching URLs will be scraped)"),
				excludePatterns: z
					.array(z.string())
					.optional()
					.describe("Regex patterns for URLs to exclude from scraping"),
			}),
			execute: async (args, context?: ToolExecuteOptions) => {
				if (!context?.isActive) {
					throw new Error("Operation has been cancelled")
				}

				try {
					voltlogger.info(`Starting batch scrape: ${args.urls.length} URLs, depth ${args.maxDepth}`, {
						operationId: context?.operationId,
					})

					const visitedUrls = new Set<string>()
					const urlsToVisit: Array<{ url: string; depth: number }> = args.urls.map(url => ({ url, depth: 1 }))
					const results: Array<{
						url: string
						depth: number
						success: boolean
						content?: { markdown: string; codeBlocks: Array<{
							language: string
							code: string
							context?: string
							filename?: string
							index: number
							elementIndex: number
						}> }
						error?: string
						linksFound?: number
						scrapedAt: string
					}> = []

					// Helper function to check if URL matches patterns
					const matchesPattern = (url: string, patterns?: string[]): boolean => {
						if (!patterns || patterns.length === 0) {return true}
						return patterns.some(pattern => {
							try {
								return new RegExp(pattern).test(url)
							} catch {
								return false
							}
						})
					}

					// Helper function to extract links from HTML
					const extractLinks = (html: string, baseUrl: string): string[] => {
						const $ = cheerio.load(html)
						const links: string[] = []
						const baseDomain = new URL(baseUrl).hostname

						$('a[href]').each((idx, el) => {
							try {
								const href = $(el).attr('href')
								if (!href || href.startsWith('#') || href.startsWith('javascript:')) {return}

								const absoluteUrl = new URL(href, baseUrl).href
								const linkDomain = new URL(absoluteUrl).hostname

								// Check if we should follow external links
								if (!args.followExternalLinks && linkDomain !== baseDomain) {return}

								// Check include/exclude patterns
								if (!matchesPattern(absoluteUrl, args.includePatterns)) {return}
								if (matchesPattern(absoluteUrl, args.excludePatterns)) {return}

								// push absoluteUrl; include index as a lightweight disambiguator in case of identical hrefs
								// keep return type string[] to avoid API changes, encode idx as a suffix so dedupe still works
								links.push(`${absoluteUrl}#idx=${idx}`)
							} catch {
								// Invalid URL, skip
							}
						})

						// remove the appended index suffix when returning unique URLs
						return [...new Set(links)].map(l => l.replace(/#idx=\d+$/, ''))
					}

					// Helper function to scrape a single page
					const scrapePage = async (url: string): Promise<{ content: { markdown: string; codeBlocks: Array<{
						language: string
						code: string
						context?: string
						filename?: string
						index: number
						elementIndex: number
					}> }; html: string }> => {
						// fetch with timeout and parse without an extra try/catch that just rethrows
						const response = await fetch(url, {
							headers: {
								"User-Agent":
									"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
							},
							signal: AbortSignal.timeout(30000), // 30 second timeout
						})

						if (!response.ok) {
							throw new Error(`HTTP ${response.status}: ${response.statusText}`)
						}

						const html = await response.text()
						const $ = cheerio.load(html)

						// Extract code blocks first
						const codeBlocks: Array<{
							language: string
							code: string
							context?: string
							filename?: string
							index: number
							elementIndex: number
						}> = []
						let blockIndex = 0

						$("pre, code").each((idx, element) => {
							const $el = $(element)
							let code = ""
							let language = "plaintext"

							if ($el.is("pre")) {
								const $code = $el.find("code").first()
								code = $code.length > 0 ? $code.text() : $el.text()
								const classAttr = $code.attr("class") || $el.attr("class")
								if (classAttr) {
									const match = /language-(\w+)/.exec(classAttr)
									language = match ? match[1] : "plaintext"
								}
							} else if ($el.is("code")) {
								code = $el.text()
								const classAttr = $el.attr("class")
								if (classAttr) {
									const match = /language-(\w+)/.exec(classAttr)
									language = match ? match[1] : "plaintext"
								}
							}

							if (code.trim()) {
								codeBlocks.push({
									language,
									code: code.trim(),
									index: blockIndex++,
									elementIndex: idx,
								})
							}
						})

						// Extract markdown content
						const dom = new JSDOM(html, { url })
						const document = dom.window.document
						document.querySelectorAll("script, style, noscript, nav, footer").forEach((el) => el.remove())
						const contentEl = document.querySelector("main, article, .content, #content, body") || document.body
						const markdown = turndownService.turndown(contentEl.innerHTML)

						const content = {
							markdown: markdown.trim(),
							codeBlocks,
						}

						return { content, html }
					}

					// Main scraping loop
					let pagesScraped = 0

					while (urlsToVisit.length > 0 && pagesScraped < args.maxPages && context?.isActive) {
						const { url, depth } = urlsToVisit.shift()!

						if (visitedUrls.has(url)) {continue}
						visitedUrls.add(url)

						const result: (typeof results)[0] = {
							url,
							depth,
							success: false,
							scrapedAt: new Date().toISOString(),
						}

						try {
							voltlogger.debug(`Scraping: ${url} (depth ${depth})`, {
								operationId: context?.operationId,
							})

							const { content, html } = await scrapePage(url)
							result.content = content
							result.success = true
							pagesScraped++

							// Extract links for next depth if within maxDepth
							if (depth < args.maxDepth) {
								const links = extractLinks(html, url)
								result.linksFound = links.length

								// Add new URLs to visit queue
								for (const link of links) {
									if (!visitedUrls.has(link) && !urlsToVisit.some(u => u.url === link)) {
										urlsToVisit.push({ url: link, depth: depth + 1 })
									}
								}
							}

							voltlogger.debug(`Successfully scraped: ${url}`, {
								operationId: context?.operationId,
							})

						} catch (error) {
							result.error = error instanceof Error ? error.message : String(error)
							voltlogger.warn(`Failed to scrape ${url}: ${result.error}`, {
								operationId: context?.operationId,
							})
						}

						results.push(result)

						// Respectful delay between requests
						if (urlsToVisit.length > 0 && context?.isActive) {
							await new Promise(resolve => setTimeout(resolve, args.delayMs))
						}
					}

					const successfulScrapes = results.filter(r => r.success).length
					const failedScrapes = results.filter(r => !r.success).length

					voltlogger.info(`Batch scraping completed: ${successfulScrapes} successful, ${failedScrapes} failed`, {
						operationId: context?.operationId,
						totalUrls: args.urls.length,
						maxDepth: args.maxDepth,
						pagesScraped,
					})

					return {
						startingUrls: args.urls,
						totalPagesAttempted: results.length,
						successfulPages: successfulScrapes,
						failedPages: failedScrapes,
						maxDepthReached: Math.max(...results.map(r => r.depth)),
						results,
						batchCompletedAt: new Date().toISOString(),
					}

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					voltlogger.error(`Batch scraping failed: ${errorMessage}`, {
						operationId: context?.operationId,
						startingUrls: args.urls,
					})
					throw new Error(`Failed to perform batch scraping: ${errorMessage}`)
				}
			},
		}),
	],
}) // close createToolkit call and object
