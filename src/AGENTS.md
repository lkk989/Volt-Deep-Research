# AGENTS.md

Agent-specific instructions for the `src/` directory and its subdirectories.

## Directory Purpose

The `src/` directory contains all production code for the Mastervolt Deep Research project:

- **agents/** - Multi-agent orchestration system with specialized agent implementations
- **config/** - Centralized configuration for logging, MCP, storage, and external services
- **tools/** - Custom AI tools and toolkits for agents to use
- **a2a/** - Agent-to-Agent communication infrastructure

## Key Patterns by Directory

### src/agents/ - Agent Development

All agents follow the same configuration pattern. When creating or modifying agents:

1. **Import Structure** (in order):

   ```typescript
   import { Agent, Memory, AiSdkEmbeddingAdapter, ... } from "@voltagent/core"
   import { google } from "@ai-sdk/google"
   import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
   import { voltlogger } from "../config/logger.js"
   import z from "zod"
   import { /* toolkit imports */ } from "../tools/*.js"
   ```

2. **Memory Setup** (always required):
   - Use LibSQL adapter: `new LibSQLMemoryAdapter({ url: "file:./.voltagent/{agent-id}-memory.db" })`
   - Enable working memory with user scope and Zod schema
   - Use Google embedding: `google.textEmbedding("gemini-embedding-001")`
   - Enable cache: `enableCache: true`

3. **Agent Configuration** (always required fields):
   - `id`: lowercase with hyphens (e.g., `"assistant"`)
   - `name`: PascalCase (e.g., `"Assistant"`)
   - `purpose`: Clear, concise role description
   - `model`: Google Gemini by default (or OpenAI/Vertex as alternative)
   - `instructions`: Detailed system prompt
   - `logger: voltlogger` (always include)
   - `maxHistoryEntries: 100` (standard default)
   - `maxSteps: 25` (adjust for complex tasks)

4. **Files**:
   - `assistant.agent.ts` - Query generation and search coordination
   - `writer.agent.ts` - Report synthesis and composition
   - `director.agent.ts` - Supervisor managing sub-agents
   - `prompts.ts` - Shared prompt templates and utilities

### src/config/ - Configuration Modules

When creating configuration files:

1. **logger.ts** - Pino-based logging setup
   - Export: `export const voltlogger = createPinoLogger({...})`
   - Import everywhere: `import { voltlogger } from "../config/logger.js"`
   - Level: "trace" (shows all messages)

2. **mcp.ts** - Model Context Protocol server configuration
   - Export: `export const mcp_Config = new MCPConfiguration({...})`
   - Servers defined as: `{ type: "stdio" | "http", command?, url? }`
   - Timeout: 60000ms recommended

3. **retriever.ts** - Data retrieval setup
   - Configure data source connections
   - Export retriever instances for use in agents

4. **scorers.ts** - Evaluation and scoring setup
   - Define scoring functions for agent outputs
   - Use Zod schemas for validation

5. **supabase.ts** - Supabase client initialization
   - Initialize with environment variables
   - Export client instance for use in agents

### src/tools/ - Tool and Toolkit Development

When creating tools:

1. **Import Structure**:

   ```typescript
   import { createTool, createReasoningTools, type Toolkit } from "@voltagent/core"
   import z from "zod"
   import { voltlogger } from "../config/logger.js"
   ```

2. **Tool Creation Pattern**:

   ```typescript
   export const toolName = createTool({
     name: "tool_name",
     description: "What it does",
     parameters: z.object({
       param: z.string().describe("Parameter purpose"),
     }),
     execute: async (args, context) => {
       if (!context?.isActive) throw new Error("Operation cancelled")
       voltlogger.info(`Tool: ${args.param}`)
       return `Result: ...`
     }
   })
   ```

3. **Toolkit Creation Pattern**:

   ```typescript
   const toolkit: Toolkit = createReasoningTools({
     think: true,
     analyze: true,
     addInstructions: true,
   })
   export { toolkit }
   ```

4. **Files**:
   - `reasoning-tool.ts` - Reasoning toolkits (think, analyze)
   - `debug-tool.ts` - Debugging and context inspection

### src/a2a/ - Agent-to-Agent Communication

When working with A2A:

1. **server.ts** - A2A server implementation
   - Handles agent-to-agent message routing
   - Manages handoff coordination

2. **store.ts** - Shared state management
   - Stores shared context between agents
   - Manages conversation state

## Development Commands for src/

### Focus on Agent Tests

```bash
npx vitest run -t "agent name"
```

## Import Rules for src/

1. **Always use .js extension for local ES module imports**:

   ```typescript
   import { assistantAgent } from "./agents/assistant.agent.js"
   import { voltlogger } from "./config/logger.js"
   ```

2. **Import types using `import type`**:

   ```typescript
   import type { Agent, Memory } from "@voltagent/core"
   ```

3. **Group imports**: External libraries first, then internal (alphabetical within groups)

   ```typescript
   import { Agent } from "@voltagent/core"
   import { google } from "@ai-sdk/google"
   import z from "zod"
   
   import { voltlogger } from "./config/logger.js"
   import { assistantAgent } from "./agents/assistant.agent.js"
   ```

## Code Style for src/

### Variable Naming

- Agent instances: `{adjective}Agent` (e.g., `assistantAgent`, `writerAgent`)
- Memory instances: `{adjective}Memory` (e.g., `agentMemory`, `writerMemory`)
- Toolkit instances: `{name}Toolkit` (e.g., `thinkOnlyToolkit`, `reasoningToolkit`)
- Configuration objects: `{domain}Config` (e.g., `mcpConfig`, `observabilityConfig`)

### Function Naming

- Tool functions: PascalCase (e.g., `export const DebugTool = createTool({...})`)
- Utility functions: camelCase (e.g., `getAgentConfig()`, `validateSchema()`)

### Constants

- Agent IDs: lowercase with hyphens (e.g., `const AGENT_ID = "assistant"`)
- Model identifiers: exact string from provider (e.g., `"gemini-2.5-flash-lite-preview-09-2025"`)

## Memory File Locations

All agents store memory in `.voltagent/` directory:

```bash
.voltagent/
├── assistant-memory.db    # Assistant agent's semantic memory
├── writer-memory.db       # Writer agent's semantic memory
├── director-memory.db     # Director agent's semantic memory
├── memory.db              # Shared vector store for all agents
└── observability.db       # OpenTelemetry traces
```

Ensure agents use the pattern: `url: "file:./.voltagent/{agent-id}-memory.db"`

## Logging Patterns for src/

Always use `voltlogger` from config:

```typescript
import { voltlogger } from "./config/logger.js"

voltlogger.info("Agent initialized")
voltlogger.error("Agent failed", { error })
voltlogger.trace("Detailed operation info")
```

Log levels (in order of verbosity):

- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages
- `debug` - Debug-level messages
- `trace` - Trace-level messages (most detailed)

## Error Handling Patterns for src/

1. **Tool Cancellation Check**:

   ```typescript
   if (!context?.isActive) {
     throw new Error("Operation was cancelled")
   }
   ```

2. **Async Error Propagation**:

   ```typescript
   try {
     const result = await agent.generateText(prompt)
   } catch (error) {
     voltlogger.error("Agent failed", { error })
     throw new Error(`Agent execution failed: ${error.message}`)
   }
   ```

3. **Validation Errors**:

   ```typescript
   const schema = z.object({ name: z.string() })
   try {
     schema.parse(data)
   } catch (error) {
     throw new Error(`Validation failed: ${error.message}`)
   }
   ```

## Testing Patterns for src/

### Test File Location

Place tests colocated with source:

- `src/agents/assistant.agent.test.ts`
- `src/tools/debug-tool.test.ts`
- `src/config/logger.test.ts`

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { agentName } from './agent-name.js'

describe('Agent Name', () => {
  beforeEach(() => {
    // Setup
  })
  
  afterEach(() => {
    // Cleanup
  })
  
  it('should do expected behavior', async () => {
    const result = await agentName.generateText("prompt")
    expect(result).toBeDefined()
  })
})
```

### Testing Agents

```typescript
it('should generate text response', async () => {
  const result = await assistantAgent.generateText("test query")
  expect(result).toHaveProperty('text')
  expect(result.text).toMatch(/search|query/)
})
```

### Testing Tools

```typescript
it('should execute with valid parameters', async () => {
  const result = await debugTool.execute(
    { message: "test" },
    { isActive: true, operationId: "test-op" }
  )
  expect(result).toContain("Logged: test")
})
```

## Workflow Development

When creating workflows in `src/index.ts`:

1. **Define Input/Output Schemas**:

   ```typescript
   const workflow = createWorkflowChain({
     id: "workflow-id",
     name: "Workflow Name",
     purpose: "Description",
     input: z.object({ topic: z.string() }),
     result: z.object({ text: z.string() }),
   })
   ```

2. **Chain Steps Sequentially**:

   ```typescript
   .andThen({
     id: "step-one",
     execute: async ({ data }) => { /* ... */ }
   })
   .andThen({
     id: "step-two",
     execute: async ({ data, getStepData }) => {
       const prev = getStepData("step-one")
       /* ... */
     }
   })
   ```

3. **Access Previous Step Data**:

   ```typescript
   const previousData = getStepData("step-id")
   ```

## Quick Reference for src/

### Agent Configuration Checklist

- [ ] Define unique `id` (lowercase with hyphens)
- [ ] Set descriptive `purpose`
- [ ] Configure memory with LibSQL adapter
- [ ] Include `logger: voltlogger`
- [ ] Set `maxHistoryEntries` (default: 100)
- [ ] Set `maxSteps` for task complexity
- [ ] Use Google embedding for consistency
- [ ] Export as named export
- [ ] Use PascalCase for agent `name`

### Tool Creation Checklist

- [ ] Define Zod schema with `.describe()` on each parameter
- [ ] Use lowercase with underscores for tool `name`
- [ ] Check `context?.isActive` before execution
- [ ] Log significant operations with `voltlogger`
- [ ] Return string or structured object
- [ ] Throw descriptive errors
- [ ] Export as named export

### Code Quality Checklist

- [ ] No `any` types (use `unknown` or generics)
- [ ] All imports use `.js` extension
- [ ] Type imports use `import type`
- [ ] Named exports only (no default)
- [ ] No hardcoded secrets
- [ ] All errors logged before throwing
- [ ] Proper TypeScript strict mode compliance
- [ ] ESLint passes: `npm run lint`
- [ ] Tests pass: `npm test`

## Performance Tips for src/

### Memory Optimization

- Use `enableCache: true` on memory for embedding operations
- Set reasonable `maxHistoryEntries` (100 is good default)
- Limit `maxSteps` to prevent runaway agents (25 is good default)

### Agent Efficiency

- Use `maxOutputTokens` to prevent excessive output
- Adjust `temperature` for consistency (lower = more predictable)
- Use toolkits instead of individual tools when possible

### Concurrency

- Agents process sequentially within a conversation
- Multiple conversations can run in parallel
- Use A2A for agent-to-agent coordination

## Documentation in src/

- Keep JSDoc comments minimal (code should be self-documenting)
- Focus comments on WHY, not WHAT
- Document non-obvious algorithms or constraints
- Use standard ESLint comment format for annotations:

  ```typescript
  // TODO: Something to do
  // FIXME: Something broken
  // NOTE: Important context
  // HACK: Temporary workaround
  ```

---

**Last Updated**: October 2025
**Scope**: src/ and all subdirectories
**Framework**: VoltAgent v1.1.35
**Language**: TypeScript 5.9.3
