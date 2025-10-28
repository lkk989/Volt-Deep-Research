---
applyTo: './src/**'
description: 'Comprehensive development standards for Mastervolt project'
---

# Development Standards

**Mastervolt** follows enterprise-grade development standards with strict TypeScript configuration, comprehensive testing, and production-ready patterns.

## File & Naming Conventions

### File Structure

- **Agent Files**: kebab-case with .agent.ts suffix (assistant.agent.ts, data-analyzer.agent.ts)
- **Tool Files**: kebab-case with -tool.ts suffix (reasoning-tool.ts, debug-tool.ts)
- **Toolkit Files**: kebab-case with -toolkit.ts suffix (web-scraper-toolkit.ts)
- **Config Files**: kebab-case in src/config/ (logger.ts, mcp.ts, supabase.ts)
- **Directories**: lowercase (src/agents/, src/tools/, src/experiments/)

### Naming Standards

- **Agent IDs**: lowercase-hyphen ("assistant", "data-analyzer", "fact-checker")
- **Agent Names**: PascalCase ("Assistant", "Data Analyzer", "Fact Checker")
- **Tool Names**: snake_case ("analyze_data_patterns", "verify_claim", "scrape_webpage_markdown")
- **Variables**: camelCase (assistantAgent, agentMemory, voltlogger)
- **Constants**: UPPER_SNAKE_CASE (MAX_HISTORY_ENTRIES, DEFAULT_TEMPERATURE)
- **Types**: PascalCase (AgentConfig, ToolResult, WorkflowStep)

## TypeScript Configuration

### Compiler Settings (tsconfig.json)

- **Target**: ES2022 (modern JavaScript features)
- **Module**: NodeNext (ES modules with .js extensions)
- **Strict Mode**: All strict options enabled
- **No Implicit Any**: Enforced throughout codebase
- **Module Resolution**: NodeNext with case-sensitive imports

### Import Standards

```typescript
// Type-only imports
import type { Agent, Memory, OperationContext } from "@voltagent/core"

// Value imports
import { createTool, createToolkit } from "@voltagent/core"
import { google } from "@ai-sdk/google"

// Internal imports with .js extensions (ES modules)
import { voltlogger } from "../config/logger.js"
import { assistantPrompt } from "./prompts.js"

// Zod schema imports
import { z } from "zod"
```

## Agent Development Pattern

### Standard Agent Template

```typescript
import { Agent, Memory, AiSdkEmbeddingAdapter } from "@voltagent/core"
import { google } from "@ai-sdk/google"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltlogger } from "../config/logger.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
import z from "zod"

// Memory configuration with working memory schema
const agentMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/{agent-id}-memory.db",
  }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        timezone: z.string().optional(),
      }).optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
})

export const agentName = new Agent({
  id: "agent-id",
  name: "Agent Name",
  purpose: "Clear description of agent's role and responsibilities",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: "Detailed system prompt with specific guidelines",
  tools: [], // Agent-specific tools
  toolkits: [thinkOnlyToolkit], // Shared toolkits
  memory: agentMemory,
  maxHistoryEntries: 100,
  temperature: 0.7, // Adjust based on agent needs
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: false, // true for writer agent
  logger: voltlogger,
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID()
      context.context.set('opId', opId)
      voltlogger.info(`[${opId}] Agent starting`)
    },
    onEnd: async ({ output, error, context }) => {
      const opId = context.context.get('opId')
      if (error) {
        voltlogger.error(`[${opId}] Agent error: ${error.message}`)
      } else if (output) {
        voltlogger.info(`[${opId}] Agent completed`)
      }
    },
    onToolStart: async ({ tool, context }) => {
      const opId = context.context.get('opId')
      voltlogger.info(`[${opId}] tool: ${tool.name}`)
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = context.context.get('opId')
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`)
      }
    },
    onPrepareMessages: async ({ messages }) => {
      return { messages }
    },
  },
})
```

## Tool Development Standards

### Tool Creation Pattern

```typescript
import { createTool } from "@voltagent/core"
import type { OperationContext } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"

export const toolName = createTool({
  name: "tool_name_snake_case",
  description: "Clear description of what this tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
    optionalParam: z.boolean().optional().describe("Optional parameter"),
  }),
  execute: async (args, context?: OperationContext) => {
    // ALWAYS check if operation is still active
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    try {
      voltlogger.info(`Tool executed: ${args.param}`, {
        operationId: context?.operationId,
      })

      // Tool implementation here
      const result = performOperation(args)

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      voltlogger.error(`Tool failed: ${errorMessage}`, {
        operationId: context?.operationId,
      })
      throw new Error(`Tool execution failed: ${errorMessage}`)
    }
  },
})
```

### Tool Development Rules

- **Context Checking**: ALWAYS check `context?.isActive` before execution
- **Error Handling**: Comprehensive try-catch with descriptive errors
- **Logging**: Use voltlogger with operation context throughout
- **Validation**: Zod schemas for all parameters
- **Timeouts**: 30-second timeouts for external requests
- **Return Format**: Consistent return objects with timestamps

## Code Quality Standards

### ESLint Configuration

- **No unused variables**: Warnings allowed for development
- **Object shorthand**: Required for cleaner code
- **Arrow functions**: Preferred in callbacks
- **Const by default**: Use const, let only when reassignment needed
- **No var**: Always warn against var usage
- **Type imports**: Prefer import type for types
- **Strict equality**: Always use === and !==

### Error Handling Patterns

```typescript
// Async operations with proper error handling
try {
  const result = await externalOperation()
  return { success: true, data: result }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  voltlogger.error(`Operation failed: ${errorMessage}`, { context })
  throw new Error(`Descriptive error: ${errorMessage}`)
}

// Context cancellation checking
if (!context?.isActive) {
  throw new Error("Operation has been cancelled")
}
```

### Memory Management

- **LibSQL**: Per-agent databases with shared vector store
- **Caching**: Embedding cache enabled (1000 entries, 1-hour TTL)
- **Cleanup**: Proper resource cleanup in error scenarios
- **Persistence**: User-scoped working memory across conversations

## Testing Standards

### Test Structure

- **Location**: Colocated with source (*.test.ts) or centralized (tests/)
- **Framework**: Vitest with jsdom environment
- **Timeout**: 10 seconds per test
- **Coverage**: v8 provider with comprehensive reporting

### Development Commands

```bash
npm run dev          # Development with watch mode
npm run build        # TypeScript compilation
npm run test         # Full test suite
npm run lint         # ESLint with caching
npm run eval         # Experimental evaluations
```

## Production Readiness

### Performance Considerations

- **Token Limits**: 64k max output tokens per agent
- **Step Limits**: 25 steps (30 for director, 50 for writer)
- **Memory Limits**: 100 history entries per agent
- **Timeout Handling**: 30-second external request timeouts

### Security Standards

- **Input Validation**: Zod schemas for all inputs
- **Error Messages**: No sensitive information exposure
- **Environment Variables**: Proper secrets management
- **Context Isolation**: Agent memory isolation
