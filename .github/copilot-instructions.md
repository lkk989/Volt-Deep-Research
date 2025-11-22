---
applyTo: '**/*'
description: 'GitHub Copilot instructions for Mastervolt Deep Research project to ensure code generation aligns with project architecture, patterns, and technology standards.'
---

# GitHub Copilot Instructions for Mastervolt Deep Research

This file guides GitHub Copilot to generate code consistent with the Mastervolt Deep Research project's architecture, patterns, and technology standards.

## Priority Guidelines

When generating code for this repository, follow this hierarchy:

1. **Exact Version Compatibility**: Respect the precise versions of TypeScript, Node.js, and all dependencies specified in `package.json`
2. **Project Patterns**: Study existing agent files, workflow implementations, and tool definitions before generating similar code
3. **Architecture Consistency**: Maintain the VoltAgent multi-agent orchestration pattern and established module boundaries
4. **Code Quality Standards**: Prioritize type safety, maintainability, and clear error handling patterns
5. **Configuration Files**: Align with ESLint, TypeScript, and Prettier configurations

---

## Technology Stack & Version Detection

### Language & Runtime
- **TypeScript**: 5.9.3 (ES2022 target, NodeNext module resolution)
- **Node.js**: v18+ (inferred from package.json and tsconfig)
- **Module System**: ES2022 with NodeNext module resolution
- **Strict Mode**: All TypeScript strict compiler options enabled

### Core Framework
- **VoltAgent**: @voltagent/core v1.1.35 (Primary agent orchestration framework)
  - Agent creation and configuration
  - Workflow chaining with Zod schema validation
  - Memory management (LibSQL storage with embedding support)
  - Tool creation and toolkit management
- **AI SDK**: ai v5.0.76 (Multi-model support via providers)
  - Google AI: @ai-sdk/google v2.0.23
  - Vertex AI: @ai-sdk/google-vertex v3.0.53
  - OpenAI: @ai-sdk/openai v2.0.53

### Key Dependencies
- **Logging**: @voltagent/logger v1.0.3 (Pino-based logger)
- **Memory & Vector Storage**: @voltagent/libsql v1.0.9, LibSQL with SQLite files
- **Model Context Protocol**: @voltagent/mcp-server v1.0.3
- **Web Scraping**: cheerio v1.1.2, jsdom v27.0.1, crawlee v3.15.1
- **Data Parsing**: fast-xml-parser v5.3.0, marked v16.4.1
- **Schema Validation**: zod v4.1.12
- **Observability**: @opentelemetry/sdk-node v0.207.0, LibSQL adapter
- **Server**: @voltagent/server-hono v1.2.1 (Hono web framework integration)

### Testing & Development
- **Test Framework**: Vitest v4.0.1
- **Environment**: jsdom (DOM simulation for tests)
- **Coverage**: @vitest/coverage-v8 v4.0.1
- **Code Linting**: ESLint v9.38.0 with @typescript-eslint v8.46.2
- **Code Formatting**: Prettier v3.6.2
- **TypeScript Compilation**: tsx v4.20.6

---

## Project Architecture

### Organizational Structure

```bash
src/
├── index.ts              # Application entry point - workflow initialization, VoltOps setup
├── agents/               # Multi-agent system (core business logic)
│   ├── assistant.agent.ts    # Search query generation agent
│   ├── writer.agent.ts       # Report writing & synthesis agent
│   ├── director.agent.ts     # Orchestration & supervision agent
│   └── prompts.ts            # Shared prompt templates
├── config/               # Configuration & initialization
│   ├── logger.ts         # Pino logger setup
│   ├── mcp.ts            # Model Context Protocol servers (Exa, Hugging Face)
│   ├── retriever.ts      # Data retrieval configuration
│   ├── scorers.ts        # Evaluation & scoring setup
│   └── supabase.ts       # Supabase client initialization
├── tools/                # Custom AI tools & toolkits
│   ├── reasoning-tool.ts # Multi-variant reasoning tools
│   └── debug-tool.ts     # Debugging & context inspection tool
└── a2a/                  # Agent-to-Agent communication
    ├── server.ts         # A2A server implementation
    └── store.ts          # Shared state management
```

### Architectural Patterns

#### Multi-Agent Orchestration Pattern
- **Agent Creation**: Use `new Agent({ ... })` with explicit configuration
- **Agent Hierarchy**: Director agent supervises Writer and Assistant agents via `subAgents` property
- **Handoff System**: Agents communicate through hooks (e.g., `onHandoff` logs agent transitions)
- **Workflow Chaining**: Use `createWorkflowChain()` for sequential agent collaboration with Zod schema validation

#### Memory Management Pattern
- **Storage**: LibSQL files (local SQLite) for persistence
- **Embedding**: Google text-embedding-001 for semantic search
- **Vector Storage**: LibSQL-backed vector database
- **Working Memory**: User-scoped with Zod schema validation
- **File Paths**: `.voltagent/{agent-id}-memory.db` convention

#### Tool Integration Pattern
- **Tool Creation**: Use `createTool()` with Zod schema parameters
- **Tool Execution**: Async execution with context object containing `operationId`, `userId`, `conversationId`
- **Toolkit Management**: Group related tools using `createReasoningTools()` or custom toolkits
- **MCP Integration**: MCPConfiguration manages external tools from remote servers

#### Configuration Pattern
- **Logging**: Use `voltlogger` from `./config/logger.ts` throughout the application
- **MCP Servers**: Define in `./config/mcp.ts` with stdio or HTTP connection types
- **Environment**: Load from `.env` file (e.g., `process.env.EXA_API_KEY`, `process.env.VOLTAGENT_PUBLIC_KEY`)

---

## Codebase Patterns

### Agent Configuration Pattern

```typescript
// Standard agent setup (see assistant.agent.ts, writer.agent.ts, director.agent.ts)
const agentMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/{agent-id}-memory.db" }),
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
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
});

export const agentName = new Agent({
  id: "agent-id",
  name: "Agent Name",
  purpose: "Clear description of agent's role",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: `Detailed system instructions...`,
  tools: [],
  toolkits: [thinkOnlyToolkit],
  memory: agentMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  temperature: 0.7,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: false,
  logger: voltlogger,
});
```

### Workflow Chaining Pattern

```typescript
// Standard workflow setup (see index.ts)
const workflow = createWorkflowChain({
  id: "workflow-id",
  name: "Workflow Name",
  purpose: "Detailed description",
  input: z.object({ /* schema */ }),
  result: z.object({ /* schema */ }),
})
  .andThen({
    id: "step-id",
    execute: async ({ data, getStepData }) => {
      // Access previous step data with getStepData("step-id")
      return { /* output */ };
    },
  });
```

### Naming Conventions

- **Agent IDs**: lowercase with hyphens (e.g., `assistant`, `writer`, `director`)
- **Agent Names**: PascalCase with full meaning (e.g., `Assistant`, `Writer`, `Director`)
- **File Names**: kebab-case (e.g., `assistant.agent.ts`, `reasoning-tool.ts`)
- **Variables**: camelCase (e.g., `assistantAgent`, `writerMemory`, `thinkOnlyToolkit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HISTORY_ENTRIES`, `DEFAULT_TEMPERATURE`)
- **Memory Files**: `.voltagent/{agent-id}-memory.db` format
- **Tool Names**: lowercase with underscores (e.g., `log_debug_info`, `get_weather`)

### Tool Creation Pattern

```typescript
// Standard tool implementation (see debug-tool.ts)
export const customTool = createTool({
  name: "tool_name",
  description: "Clear description of tool functionality",
  parameters: z.object({
    paramName: z.string().describe("Parameter description"),
  }),
  execute: async (args, context) => {
    // Access context: operationId, userId, conversationId, input, context.get()
    // Check context?.isActive before executing
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }
    
    voltlogger.info(`Tool executed: ${args.paramName}`);
    return `Result: ...`;
  },
});
```

### Logging Pattern

```typescript
// Use voltlogger from ./config/logger.ts throughout
import { voltlogger } from "./config/logger.js";

voltlogger.info("Message at info level");
voltlogger.error("Error message", { errorDetails });
voltlogger.trace("Detailed trace information");
```

### Error Handling Pattern

- **Throw Errors**: Use `throw new Error("Clear error message")` for synchronous operations
- **Async Errors**: Let errors bubble up through async/await or use try-catch
- **Context Cancellation**: Check `context?.isActive` and throw if operation is cancelled
- **Logging**: Log errors with context before throwing

### Code Organization Rules

1. **Imports First**: All imports at the top, with internal imports last
2. **Type Definitions**: Define Zod schemas near their usage point
3. **Configuration Objects**: Define before using in function calls
4. **Export Style**: Use named exports for all agents, tools, and utilities
5. **File Colocation**: Keep related code together (agent + its tools, workflow + its agents)

---

## TypeScript & Code Style

### TypeScript Configuration
- **Target**: ES2022
- **Strict Mode**: `true` (all strict options enabled)
- **Module Resolution**: NodeNext
- **ES Module Interop**: Enabled
- **Force Consistent Casing**: Enabled

### Code Style Rules

Follow the ESLint configuration in `eslint.config.cjs`:

- **Type Imports**: Use `import type { TypeName } from "module"` for types
- **Array Type**: Use `Type[]` syntax (not `Array<Type>`)
- **Type Definitions**: Use `interface` over `type` for object types
- **Return Types**: Can be inferred; explicit returns not required unless ambiguous
- **Object Shorthand**: Always use shorthand (e.g., `{ name }` not `{ name: name }`)
- **Arrow Functions**: Prefer arrow functions as callbacks
- **Const by Default**: Use `const`, only `let` when reassignment needed
- **No `var`**: Never use `var`
- **Nullish Coalescing**: `??` for null checks (not enforced, but preferred)
- **Optional Chaining**: `?.` for safe property access (not enforced, but preferred)
- **Boolean Expressions**: Explicit boolean checks (e.g., `if (value === true)`)
- **Equality**: Always use strict equality `===` and `!==`
- **No Shadow**: Variables should not shadow outer scope
- **No Explicit Any**: Avoid `any` types; use `unknown` or generics

### Formatting

Use Prettier configuration (`prettier.config.js`):
- **Trailing Commas**: es5 style
- **Tab Width**: 4 spaces
- **Semicolons**: Off (no semicolons)
- **Quotes**: Single quotes

### Import/Export Patterns

```typescript
// Import types
import type { SomeType } from "@voltagent/core"

// Import values
import { Agent, Memory } from "@voltagent/core"

// Import with .js extension for ES modules
import { assistantAgent } from "./agents/assistant.agent.js"

// Named exports (preferred)
export const agentName = new Agent({...})
export const toolName = createTool({...})

// Re-exports with selective renaming
export { agentName as default }
```

---

## Testing Standards

### Test Setup
- **Framework**: Vitest v4.0.1
- **Environment**: jsdom for DOM-like testing
- **Test Timeout**: 10 seconds per test
- **Setup**: `globalSetup.ts` (global setup), `testSetup.ts` (per-test setup)

### Test File Patterns
- Colocated tests: `src/**/*.test.ts` or `src/**/*.spec.ts`
- Centralized tests: `tests/**/*.test.ts` or `tests/**/*.spec.ts`
- Both patterns are supported simultaneously

### Coverage Configuration
- **Provider**: v8
- **Threshold**: None explicitly set (see `vitest.config.ts`)
- **Excluded**: `node_modules/`, `tests/`, `**/*.d.ts`, test files themselves
- **Included**: `src/**/*.{ts,tsx}`

### Test Pattern Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Agent Name', () => {
  let agent: Agent
  
  beforeEach(() => {
    // Setup
  })
  
  afterEach(() => {
    // Cleanup
  })
  
  it('should perform expected behavior', async () => {
    const result = await agent.generateText("prompt")
    expect(result).toBeDefined()
  })
})
```

---

## Development Workflow

### Scripts
- **`npm run dev`**: Start in development mode with tsx watch
- **`npm run build`**: Compile TypeScript to `dist/` directory
- **`npm start`**: Run compiled output from `dist/index.js`
- **`npm run lint`**: Run ESLint with cache
- **`npm test`**: Run Vitest in run mode (not watch)
- **`npm run eval`**: Run evaluations with viteval
- **`npm run volt`**: Run VoltAgent CLI commands

### Environment Variables
Required `.env` file:
```env
VOLTAGENT_PUBLIC_KEY=your_key_here
VOLTAGENT_SECRET_KEY=your_key_here
EXA_API_KEY=your_exa_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
OPENAI_API_KEY=your_openai_key
HUGGING_FACE_TOKEN=your_hugging_face_token
```

### Build & Deployment
- **TypeScript Compilation**: `tsc` compiles to `dist/`
- **Output Directory**: `dist/`
- **Entry Point**: `dist/index.js` after compilation
- **Watch Mode**: Use `tsx watch` for development

---

## Agent Development Guidelines

### When Creating a New Agent

1. **Follow the Template**: Use existing agents (assistant.agent.ts, writer.agent.ts) as templates
2. **Memory Setup**: Initialize LibSQL memory adapter with unique agent ID
3. **Embedding**: Use Google text-embedding-001 for consistency
4. **Model Selection**: Choose from available providers (Google, OpenAI, Vertex)
5. **Purpose & Instructions**: Write clear, detailed system instructions
6. **Tools & Toolkits**: Add tools via `tools: []` or `toolkits: []`
7. **Logging**: Include `logger: voltlogger` in configuration
8. **Export**: Use named export pattern: `export const agentName = new Agent({...})`

### When Creating a New Tool

1. **Use `createTool()` Factory**: Define schema with Zod
2. **Parameter Schema**: Always include `.describe()` for each parameter
3. **Context Checking**: Check `context?.isActive` before execution
4. **Error Handling**: Throw descriptive errors; log important operations
5. **Logging**: Use `voltlogger` for all operations
6. **Return Type**: Return string or structured object

### When Creating a Workflow

1. **Define Input Schema**: Use Zod for runtime validation
2. **Define Result Schema**: Specify expected output shape
3. **Chain Steps**: Use `.andThen()` for sequential execution
4. **Data Access**: Use `getStepData("step-id")` to access previous outputs
5. **Error Propagation**: Let errors bubble up; VoltOps handles logging

---

## Common Patterns to Follow

### Pattern 1: Multi-Step Research Workflow
```typescript
const workflow = createWorkflowChain({
  id: "research",
  // ... config
})
  .andThen({ id: "search", execute: async ({ data }) => { /* query generation */ } })
  .andThen({ id: "write", execute: async ({ data, getStepData }) => { /* synthesis */ } })
```

### Pattern 2: Agent with Sub-Agents (Supervision)
```typescript
export const directorAgent = new Agent({
  subAgents: [writerAgent, assistantAgent],
  supervisorConfig: {
    customGuidelines: ["..."]
  },
  hooks: {
    onHandoff: ({ agent, sourceAgent }) => {
      voltlogger.info(`${sourceAgent.name} → ${agent.name}`)
    }
  },
  // ... rest of config
})
```

### Pattern 3: Tool with Context Validation
```typescript
export const myTool = createTool({
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation was cancelled")
    }
    
    voltlogger.info(`Operation: ${context?.operationId}`)
    voltlogger.info(`User: ${context?.userId}`)
    
    // Tool logic here
  }
})
```

---

## Security & Best Practices

### Environment Handling
- **Never Hardcode Secrets**: Always use `process.env.VAR_NAME`
- **Validate Inputs**: Use Zod schemas for all user inputs
- **Timeout Management**: Set appropriate `maxSteps` and timeouts
- **Error Messages**: Don't expose sensitive information in error messages

### Performance Considerations
- **Memory Caching**: Enable caching for embedding operations (`enableCache: true`)
- **History Limiting**: Set reasonable `maxHistoryEntries` (typically 100 for agents)
- **Step Limits**: Set `maxSteps` to prevent infinite loops (typically 25-50)
- **Token Limits**: Set `maxOutputTokens` based on model capabilities

### Code Quality
- **Type Safety**: Leverage TypeScript's strict mode everywhere
- **Schema Validation**: Validate all data with Zod schemas
- **Error Handling**: Always handle async operations with try-catch or error propagation
- **Logging**: Log significant operations for debugging and monitoring

---

## Integration with VoltOps & Observability

### VoltOps Setup (from index.ts pattern)
```typescript
const voltOpsClient = new VoltOpsClient({
  publicKey: process.env.VOLTAGENT_PUBLIC_KEY,
  secretKey: process.env.VOLTAGENT_SECRET_KEY,
})

new VoltAgent({
  agents: { /* all agents */ },
  workflows: { /* all workflows */ },
  server: honoServer(),
  logger: voltlogger,
  enableSwaggerUI: true,
  observability, // Optional
  voltOpsClient, // Enables automatic forwarding
})
```

### Observability Pattern
- **Storage**: LibSQL database for traces
- **Sampling**: Configure ratio (default 0.5 = 50%)
- **Batching**: Adjust `maxQueueSize`, `maxExportBatchSize`, `scheduledDelayMillis`
- **OpenTelemetry**: Integration with Node SDK for auto-instrumentation

---

## When in Doubt

1. **Check Existing Code First**: Look at similar implementations before generating new code
2. **Follow Agent Pattern**: All agents follow the same setup pattern
3. **Use Zod for Schemas**: Never skip schema validation
4. **Test with Vitest**: Write tests following existing test patterns
5. **Use Prettier & ESLint**: Run formatters before committing
6. **Consult Memory Bank**: Check `.github/instructions/` files for project-specific guidance
7. **Respect TypeScript Strict Mode**: Don't bypass type safety

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Start with tsx watch
npm run build        # Compile TypeScript
npm start            # Run compiled output

# Code Quality
npm run lint         # Check with ESLint
npm test             # Run tests with Vitest
npm run eval         # Run evaluations

# VoltAgent CLI
npm run volt         # VoltAgent CLI commands
```

---

## Version Compatibility Matrix

| Technology | Version | Purpose |
|-----------|---------|---------|
| TypeScript | 5.9.3 | Language & compilation |
| Node.js | 18+ | Runtime |
| @voltagent/core | 1.1.35 | Agent orchestration |
| @ai-sdk/google | 2.0.23 | Google AI models |
| @ai-sdk/openai | 2.0.53 | OpenAI models |
| vitest | 4.0.1 | Testing framework |
| zod | 4.1.12 | Schema validation |
| prettier | 3.6.2 | Code formatting |
| eslint | 9.38.0 | Code linting |

---

## Project-Specific Guidance

### Core Values
- **Type Safety First**: Strict TypeScript enables confidence and maintainability
- **Schema Validation**: Zod schemas validate all data boundaries
- **Clear Logging**: All significant operations are logged for debugging
- **Multi-Agent Design**: Orchestration through explicit agent coordination, not monolithic design
- **AI Model Flexibility**: Support multiple LLM providers without vendor lock-in

### Known Constraints
- Memory files stored locally in `.voltagent/` directory
- LibSQL vector store requires `.voltagent/memory.db` file
- Google embedding model is primary choice (consistent across agents)
- Exa MCP integration requires `EXA_API_KEY` environment variable
- Workflow execution is sequential via `.andThen()` chaining

### Extension Points
When adding new capabilities:
1. **New Agents**: Follow `assistant.agent.ts` template
2. **New Tools**: Follow `debug-tool.ts` or `reasoning-tool.ts` patterns
3. **New Workflows**: Follow `index.ts` workflow chaining pattern
4. **New MCP Servers**: Add to `config/mcp.ts` configuration
5. **New Memory Adapters**: Use LibSQL pattern but can extend with additional storage

---

**Last Updated**: October 2025
**Project**: Mastervolt Deep Research (VoltAgent-based AI Research System)
**Framework**: VoltAgent v1.1.35
**Language**: TypeScript 5.9.3

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
