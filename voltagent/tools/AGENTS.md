---
Description: Documentation for the tools folder in the VoltAgent project
version: 1.0
createdAT: 2025-10-25
updatedAT: 2025-10-26
tags:
  - voltagent
  - tools
  - documentation
  - web-scraping
  - reasoning
  - debugging
---
# AGENTS.md - Tools Folder

AI agents working on this project should use this file as the authoritative source for VoltAgent tool development, toolkit patterns, and integration guidelines within the tools folder.

## Project Overview

The **tools** folder contains custom VoltAgent tools and toolkits that extend the framework's capabilities for research, debugging, reasoning, and web scraping operations. These tools are designed to be reusable across agents and workflows, following strict VoltAgent patterns with proper error handling, logging, and context management.

### Key Technologies

- **Framework**: VoltAgent v1.1.35 (TypeScript-based multi-agent orchestration)
- **Language**: TypeScript 5.9.3 (ES2022 target, strict mode enabled)
- **Runtime**: Node.js 18+
- **Tool Creation**: `createTool()` and `createToolkit()` from @voltagent/core
- **Schema Validation**: Zod v4.1.12 for parameter validation
- **Web Scraping**: cheerio v1.1.2, jsdom v27.0.1, turndown v7.2.2
- **Logging**: voltlogger from ../config/logger.js
- **Context Management**: OperationContext for operation tracking and cancellation

## Tools Folder Structure

```bash
src/tools/
├── debug-tool.ts           # Debugging and context inspection tool
├── reasoning-tool.ts       # Reasoning toolkits (think, analyze variants)
└── web-scraper-toolkit.ts  # Comprehensive web scraping toolkit
```

## Tool Categories

### Debug Tool (`debug-tool.ts`)

- **Purpose**: Context inspection and debugging operations
- **Tools**: `log_debug_info` - Logs operation metadata, user info, and custom context
- **Use Case**: Agent debugging, context validation, operation tracking

### Reasoning Toolkits (`reasoning-tool.ts`)

- **Purpose**: Cognitive reasoning and analysis capabilities
- **Toolkits**:
  - `reasoningToolkit` - Basic reasoning tools
  - `thinkOnlyToolkit` - Thinking-focused toolkit (used by agents)
  - `fullReasoningToolkit` - Complete reasoning with instructions
  - `fewShotToolkit` - Reasoning with few-shot examples
- **Use Case**: Multi-step reasoning, analysis, and decision making

### Web Scraper Toolkit (`web-scraper-toolkit.ts`)

- **Purpose**: Comprehensive web scraping toolkit for extracting and processing content from webpages
- **Tools**:
  - `scrape_webpage_markdown`: Scrapes a complete webpage and converts it to clean, well-formatted Markdown. Preserves structure, links, images, and formatting. Parameters: `url` (required), `removeScripts` (optional, default true), `includeImages` (optional, default true), `maxLength` (optional).
  - `extract_code_blocks`: Extracts all code blocks from a webpage along with their context (surrounding text, language, file references). Parameters: `url` (required), `includeContext` (optional, default true), `contextLines` (optional, default 3).
  - `extract_structured_data`: Extracts structured data from a webpage including headings, links, tables, lists, and metadata. Parameters: `url` (required), `includeMetadata` (optional, default true), `includeLinks` (optional, default true), `includeTables` (optional, default true).
  - `extract_text_content`: Extracts clean, readable text content from a webpage. Removes HTML, scripts, styles, and navigation elements. Parameters: `url` (required), `removeNavigation` (optional, default true), `cleanWhitespace` (optional, default true).
  - `batch_scrape_pages`: Performs batch scraping of multiple webpages with configurable depth. Can follow links recursively while respecting rate limits and depth constraints. Always extracts content as Markdown with embedded code blocks. Parameters: `urls` (array, max 50), `maxDepth` (optional, default 1), `maxPages` (optional, default 10), `followExternalLinks` (optional, default false), `delayMs` (optional, default 1000), `includePatterns` (optional), `excludePatterns` (optional).
- **Use Case**: Research data collection, content analysis, web automation
- **Dependencies**: cheerio, jsdom, turndown, voltlogger
- **Current State**: Fully implemented with 5 tools, proper TypeScript types (explicit array types for codeBlocks), VoltAgent toolkit structure, context checking, logging, and error handling. No unused variables or compilation errors.

## Setup Commands

### Prerequisites

- Node.js v18 or later
- npm (or compatible package manager)
- Access to parent project dependencies (@voltagent/core, cheerio, etc.)

### Environment Setup

Tools inherit environment configuration from the parent project:

```bash
# Required environment variables (from parent .env)
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
VOLTAGENT_PUBLIC_KEY=your_key_here
VOLTAGENT_SECRET_KEY=your_key_here
```

## Development Workflow

### Creating a New Tool

Follow the pattern in `debug-tool.ts`:

```typescript
import { createTool } from "@voltagent/core"
import z from "zod"
import { voltlogger } from "../config/logger.js"

export const myTool = createTool({
  name: "tool_name",
  description: "Clear description of tool functionality",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation was cancelled")
    }
    
    voltlogger.info(`Tool executed: ${args.param}`)
    return `Result: ...`
  },
})
```

### Creating a New Toolkit

Follow the pattern in `web-scraper-toolkit.ts`:

```typescript
import { createToolkit } from "@voltagent/core"
import z from "zod"
import { voltlogger } from "../config/logger.js"

export const myToolkit = createToolkit({
  name: "toolkit_name",
  description: "Toolkit description",
  instructions: "Shared instructions for all tools in this toolkit",
  tools: [
    // Define tools inline within the toolkit
    {
      name: "tool_one",
      description: "First tool description",
      parameters: z.object({ /* schema */ }),
      execute: async (args, context) => {
        // Implementation with context checking and logging
      },
    },
    // Additional tools...
  ],
})
```

### Using Built-in Reasoning Toolkits

From `reasoning-tool.ts`:

```typescript
import { createReasoningTools } from "@voltagent/core"

// Basic reasoning toolkit
const reasoningToolkit = createReasoningTools()

// Thinking-only toolkit (commonly used by agents)
const thinkOnlyToolkit = createReasoningTools({
  analyze: false,
  addInstructions: false,
  think: true,
  addFewShot: false,
})

// Full reasoning with custom examples
const customReasoning = createReasoningTools({
  analyze: true,
  addInstructions: true,
  think: true,
  addFewShot: true,
  fewShotExamples: 'Custom reasoning examples...',
})
```

## Testing Instructions

### Tool Testing Pattern

Create tests following Vitest patterns:

```typescript
import { describe, it, expect } from 'vitest'
import { myTool } from './my-tool.js'

describe('My Tool', () => {
  it('should execute successfully', async () => {
    const result = await myTool.execute(
      { param: 'test' },
      { isActive: true, operationId: 'test-op' }
    )
    expect(result).toBeDefined()
  })

  it('should handle cancellation', async () => {
    await expect(myTool.execute(
      { param: 'test' },
      { isActive: false, operationId: 'test-op' }
    )).rejects.toThrow('Operation was cancelled')
  })
})
```

### Toolkit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { myToolkit } from './my-toolkit.js'

describe('My Toolkit', () => {
  it('should contain expected tools', () => {
    expect(myToolkit.tools).toHaveLength(2)
    expect(myToolkit.tools[0].name).toBe('tool_one')
  })
})
```

## Code Style

### Tool Development Standards

- **Tool Names**: lowercase with underscores (e.g., `"scrape_markdown"`, `"extract_code_blocks"`)
- **Parameter Names**: camelCase (e.g., `url`, `selector`, `maxLength`)
- **Zod Schemas**: Define with `.describe()` for all parameters
- **Error Messages**: Clear and descriptive
- **Logging**: Use `voltlogger` for all operations
- **Context Checking**: Always check `context?.isActive` before execution

### Toolkit Organization

- **Instructions**: Provide shared instructions at toolkit level
- **Tool Definitions**: Define tools inline within `createToolkit()` call
- **Export Pattern**: Use named exports for tools and toolkits
- **Import Extensions**: Use `.js` extensions for ES module imports

### Web Scraping Best Practices

- **User-Agent**: Respect robots.txt and use appropriate user agents
- **Rate Limiting**: Implement delays between requests
- **Error Handling**: Handle network errors, timeouts, and invalid HTML
- **Content Validation**: Validate extracted content before returning
- **Resource Cleanup**: Properly dispose of DOM instances

## Build and Deployment

### Tool Integration

Tools are automatically included when imported by agents:

```typescript
import { myTool } from "../tools/my-tool.js"
import { myToolkit } from "../tools/my-toolkit.js"

const agent = new Agent({
  tools: [myTool],
  toolkits: [myToolkit],
  // ... other config
})
```

### Runtime Requirements

- Tools inherit all parent project dependencies
- No additional environment setup required
- Automatic inclusion in VoltAgent workflows

## Tool Development Guidelines

### Context Management

Always implement proper context handling:

```typescript
execute: async (args, context) => {
  // Check operation status
  if (!context?.isActive) {
    throw new Error("Operation was cancelled")
  }
  
  // Log operation details
  voltlogger.info(`Operation: ${context?.operationId}`)
  voltlogger.info(`User: ${context?.userId}`)
  
  // Implement tool logic
  return result
}
```

### Parameter Validation

Use Zod schemas for robust validation:

```typescript
parameters: z.object({
  url: z.url().describe("The URL to scrape"),
  selector: z.string().optional().describe("CSS selector for content extraction"),
  maxLength: z.number().min(1).max(10000).optional().describe("Maximum content length"),
})
```

### Error Handling Patterns

- **Cancellation**: Check `context?.isActive` and throw descriptive errors
- **Validation**: Validate inputs before processing
- **Network**: Handle timeouts, connection errors, and invalid responses
- **Parsing**: Gracefully handle malformed HTML/JSON

### Logging Standards

Use appropriate log levels:

```typescript
voltlogger.info("Tool execution started")
voltlogger.debug("Processing URL: https://example.com")
voltlogger.warn("Rate limit detected, adding delay")
voltlogger.error("Failed to parse HTML", { error: err.message })
```

## Web Scraping Toolkit Details

### scrape_markdown Tool

- **Purpose**: Convert web pages to clean markdown
- **Parameters**: `url` (required), `includeImages` (optional)
- **Output**: Markdown-formatted content
- **Dependencies**: cheerio, turndown

### extract_code_blocks Tool

- **Purpose**: Extract code snippets from web content
- **Parameters**: `url` (required), `language` (optional filter)
- **Output**: Array of code blocks with language detection
- **Dependencies**: cheerio, jsdom

### extract_structured_data Tool

- **Purpose**: Parse structured data (JSON-LD, microdata)
- **Parameters**: `url` (required), `dataType` (optional filter)
- **Output**: Structured data objects
- **Dependencies**: cheerio

### extract_text_content Tool

- **Purpose**: Extract clean text content
- **Parameters**: `url` (required), `selector` (optional), `maxLength` (optional)
- **Output**: Plain text content
- **Dependencies**: cheerio

### batch_scrape_pages Tool

- **Purpose**: Perform batch scraping with configurable depth and link following
- **Parameters**: `urls` (array, max 50), `maxDepth` (1-5), `maxPages` (1-100), `followExternalLinks`, `delayMs`, `includePatterns`, `excludePatterns`, `scrapeType`
- **Output**: Aggregated results from all scraped pages with success/failure status
- **Dependencies**: cheerio, jsdom, turndown

## Performance Considerations

### Resource Management

- **DOM Cleanup**: Dispose of jsdom instances after use
- **Memory Limits**: Set reasonable `maxLength` parameters
- **Concurrent Requests**: Implement queuing for multiple URLs
- **Caching**: Consider caching frequently accessed content

### Rate Limiting

- **Delays**: Add delays between requests (1-2 seconds)
- **Backoff**: Implement exponential backoff for retries
- **User-Agent Rotation**: Rotate user agents to avoid blocking

## Security Best Practices

### Input Validation

- **URL Validation**: Use Zod URL schema for all URL parameters
- **Selector Sanitization**: Validate CSS selectors
- **Content Limits**: Enforce maximum content lengths

### Safe Scraping

- **Respect robots.txt**: Check robots.txt before scraping
- **Terms of Service**: Review site terms before automated access
- **Rate Limits**: Respect site-imposed rate limits
- **Legal Compliance**: Ensure scraping activities are legal

## Debugging Tools

### Debug Tool Usage

```typescript
import { debugTool } from "../tools/debug-tool.js"

// In agent configuration
const agent = new Agent({
  tools: [debugTool],
  // ... config
})

// Tool execution logs:
// - Operation ID
// - User ID  
// - Conversation ID
// - Custom context values
```

### Common Issues

### Context Not Available

- Ensure tools are called within active VoltAgent operations
- Check that `context?.isActive` is true before processing

### Scraping Failures

- Verify URL accessibility
- Check for anti-bot measures
- Validate HTML structure

### Memory Issues

- Monitor DOM instance creation/destruction
- Implement content size limits
- Use streaming for large content

## Quick Reference

### Essential Patterns

```typescript
// Tool Creation
export const myTool = createTool({
  name: "tool_name",
  parameters: z.object({ /* schema */ }),
  execute: async (args, context) => {
    if (!context?.isActive) throw new Error("Cancelled")
    voltlogger.info(`Executing: ${args.param}`)
    return result
  },
})

// Toolkit Creation  
export const myToolkit = createToolkit({
  name: "toolkit_name",
  instructions: "Shared instructions",
  tools: [ /* inline tool definitions */ ],
})

// Reasoning Toolkit
const thinkOnly = createReasoningTools({
  analyze: false,
  think: true,
  addInstructions: false,
})
```

### Key Files

- `debug-tool.ts` - Context debugging and inspection
- `reasoning-tool.ts` - Reasoning toolkit variants
- `web-scraper-toolkit.ts` - Web scraping tools (4 tools)
- `../config/logger.js` - voltlogger import
- `../agents/*.agent.ts` - Agent integration examples

## Version Information

| Component | Version | Purpose |
|-----------|---------|---------|
| VoltAgent | 1.1.35 | Tool and toolkit framework |
| TypeScript | 5.9.3 | Language and compilation |
| Zod | 4.1.12 | Schema validation |
| Cheerio | 1.1.2 | HTML parsing |
| JSDOM | 27.0.1 | DOM simulation |
| Turndown | 7.2.2 | HTML to markdown |

## Additional Resources

- **VoltAgent Tools**: <https://voltagent.dev/docs/tools>
- **Zod Validation**: <https://zod.dev/>
- **Cheerio API**: <https://cheerio.js.org/>
- **Turndown**: <https://github.com/mixmark-io/turndown>

---

**Last Updated**: October 2025
**Folder**: src/tools/
**Framework**: VoltAgent v1.1.35
**Language**: TypeScript 5.9.3
