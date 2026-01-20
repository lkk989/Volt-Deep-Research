# AGENTS.md

AI agents working on this project should use this file as the authoritative source for project structure, development commands, code conventions, and testing guidelines.

## Project Overview

**Mastervolt Deep Research** is a VoltAgent-based AI research system that orchestrates multiple specialized agents to conduct research and generate comprehensive reports. The project demonstrates advanced multi-agent orchestration with workflow chaining, semantic memory management, and integration with external data sources via Model Context Protocol (MCP).

### Key Technologies

- **Framework**: VoltAgent v2.1.3 (TypeScript-based multi-agent orchestration)
- **Language**: TypeScript 5.9.3 (ES2022 target, strict mode enabled)
- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Testing**: Vitest 4.0.17 with jsdom environment
- **AI Models**: Google Gemini (primary), OpenAI support, Vertex AI support
- **Memory**: LibSQL (SQLite-based) with semantic embeddings
- **Server**: Hono web framework via @voltagent/server-hono
- **UI**: Next.js 16.x (app/ directory)

## Project Structure

```bash
src/
├── index.ts                 # Main entry point: VoltAgent initialization, workflow setup
├── agents/                  # Multi-agent orchestration system
│   ├── assistant.agent.ts   # Query generation & search coordination
│   ├── writer.agent.ts      # Report synthesis & composition
│   ├── director.agent.ts    # Supervisor agent managing sub-agents
│   └── prompts.ts           # Shared prompt templates
├── config/                  # Configuration modules
│   ├── logger.ts            # Pino-based logging setup
│   ├── mcp.ts               # MCP client configuration
│   ├── mcpserver.ts         # MCP server configuration
│   ├── retriever.ts         # Data retrieval configuration
│   ├── scorers.ts           # Evaluation & scoring setup
│   └── supabase.ts          # Supabase client initialization
├── tools/                   # Custom tools and toolkits
│   ├── reasoning-tool.ts    # Reasoning toolkits (think, analyze)
│   ├── debug-tool.ts        # Debugging & context inspection
│   └── ...                  # Additional toolkits
└── a2a/                     # Agent-to-Agent communication
    ├── server.ts            # A2A server implementation
    └── store.ts             # Shared state management

app/                         # Next.js application
└── chat/                    # UI routes/components

src/retriever/               # Vector DB retriever integrations
src/workflows/               # Workflow chain definitions
src/experiments/             # Eval/experiment configs

.voltagent/                 # Runtime directory (auto-created)
├── {agent-id}-memory.db     # Per-agent LibSQL memory database
├── memory.db                # Shared vector store
└── observability.db         # OpenTelemetry traces
```

## Setup Commands

### Prerequisites

- Node.js v18 or later
- npm (or compatible package manager)
- API keys for:
  - Google AI (GOOGLE_GENERATIVE_AI_API_KEY)
  - Exa Search (EXA_API_KEY) - optional for MCP integration
  - Hugging Face (HUGGING_FACE_TOKEN) - optional for HF models

### Install Dependencies

```bash
npm install
```

### Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Add required API keys to .env
# GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
# VOLTAGENT_PUBLIC_KEY=your_key_here
# VOLTAGENT_SECRET_KEY=your_key_here
# EXA_API_KEY=your_exa_key_here (optional)
# HUGGING_FACE_TOKEN=your_hf_token_here (optional)
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

- Runs with `tsx watch --env-file=.env` for automatic recompilation on file changes
- Loads environment variables from `.env` file
- Watches TypeScript and JavaScript files in `src/`
- Suitable for local development and testing

### Build for Production

```bash
npm run build
```

- Compiles TypeScript to JavaScript (via `dotenvx run -- tsc`)
- Output directory: `dist/`
- Uses tsconfig.json settings (ES2022 target, strict mode)
- All type checking runs during build

### Start Production Server

```bash
npm start
```

- Runs compiled output from `dist/index.js` (via `dotenvx run -- node dist/index.js`)
- Requires `npm run build` first
- No watch mode

### Code Quality Tools

#### Linting

```bash
npx eslint .
```

- Runs ESLint with caching enabled
- Uses cache location: `.eslintcache`
- Checks all TypeScript and JavaScript files matching eslint.config.js
- Fix issues: `npm run lint -- --fix`

#### Type Checking

- Runs during `npm run build`
- TypeScript strict mode enforced (all strict options enabled)
- No implicit `any` types allowed

## Testing Instructions

### Run All Tests

```bash
npm test
```

- Runs Vitest in run mode (not watch) via `dotenvx run -- npx vitest run`
- Test timeout: 10 seconds per test
- Environment: jsdom (DOM simulation)
- Output: JSON report in `tests/test-results/test-results.json`

### Test File Locations

Tests can be colocated with source code or centralized:

- Colocated: `src/**/*.test.ts` or `src/**/*.spec.ts`
- Centralized: `tests/**/*.test.ts` or `tests/**/*.spec.ts`
- Both patterns are supported simultaneously

### Test Coverage

```bash
npx vitest run --coverage
```

- Provider: v8
- Reports in `tests/test-results/coverage/`
- Coverage for: `src/**/*.{ts,tsx}`
- Excluded: node_modules, dist, tests, *.d.ts files

### Focus on Specific Tests

```bash
npx vitest run -t "test name pattern"
```

### Watch Mode (Development)

```bash
npx vitest --watch
```

### Test Setup

- Global setup: `globalSetup.ts`
- Per-test setup: `testSetup.ts`
- Hook timeout: 10 seconds

## Code Style

### TypeScript Configuration

- **Target**: ES2022 (modern JavaScript with async/await, optional chaining)
- **Module System**: NodeNext (ES modules with .js extensions)
- **Strict Mode**: All strict compiler options enabled
- **Module Resolution**: NodeNext with case-sensitive file names

### Naming Conventions

- **Files**: kebab-case (e.g., `assistant.agent.ts`, `debug-tool.ts`)
- **Directories**: lowercase (e.g., `src/agents/`, `src/config/`)
- **Agent IDs**: lowercase with hyphens (e.g., `"assistant"`, `"writer"`, `"director"`)
- **Agent Names**: PascalCase (e.g., `"Assistant"`, `"Writer"`)
- **Variables**: camelCase (e.g., `assistantAgent`, `agentMemory`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HISTORY_ENTRIES`)
- **Tool Names**: lowercase with underscores (e.g., `"log_debug_info"`, `"get_weather"`)
- **Memory Files**: `.voltagent/{agent-id}-memory.db`

### Imports & Exports

```typescript
// Type imports
import type { Agent } from "@voltagent/core"

// Value imports
import { createTool, Memory } from "@voltagent/core"

// Internal imports use .js extension for ES modules
import { assistantAgent } from "./agents/assistant.agent.js"

// Use named exports (no default exports)
export const agentName = new Agent({...})
export const toolName = createTool({...})
```

### Linting Rules (ESLint)

- **No unused variables**: Warnings allowed (`@typescript-eslint/no-unused-vars`)
- **Object shorthand**: Required (`object-shorthand: error`)
- **Arrow functions**: Preferred in callbacks (`prefer-arrow-callback`)
- **Const by default**: Use `const`, `let` only when reassignment needed
- **No `var`**: Always warn
- **Type imports**: Prefer `import type` for types
- **Array types**: Use `Type[]` not `Array<Type>`
- **Type definitions**: Use `interface` over `type` for object types
- **Equality**: Always strict (`===`, `!==`)
- **No shadow**: Variables should not shadow outer scope
- **No explicit `any`**: Use `unknown` or generics instead (warn)

### Formatting (Prettier)

- **Tab Width**: 4 spaces
- **Trailing Commas**: ES5 style
- **Semicolons**: On
- **Quotes**: Double quotes
- See `prettier.config.js` for full config

### Code Organization

1. **Imports First**: All imports at top, internal imports last
2. **Zod Schemas**: Define near usage point
3. **Configuration Objects**: Define before function calls
4. **Export Style**: Use named exports for agents, tools, utilities
5. **File Colocation**: Keep related code together (agent + tools, workflow + agents)

## Build and Deployment

### Build Output

```bash
npm run build
```

- Compiles all TypeScript files to JavaScript
- Output directory: `dist/`
- Entry point: `dist/index.js`
- Sourcemaps included for debugging

### Runtime Requirements

- Node.js 18+ at deployment time
- Environment variables loaded from `.env` or system environment:
  - `VOLTAGENT_PUBLIC_KEY` (required for VoltOps)
  - `VOLTAGENT_SECRET_KEY` (required for VoltOps)
  - `GOOGLE_GENERATIVE_AI_API_KEY` (required for Google AI)
  - `EXA_API_KEY` (optional, for Exa search MCP)

### VoltOps Integration

The application automatically forwards metrics and traces to VoltOps when configured:

- Observability enabled with LibSQL adapter
- Sampling ratio: 0.5 (50% of operations)
- Batching: max 512 events per batch, every 4 seconds
- Traces stored in `.voltagent/observability.db`

## Agent Development

### Creating a New Agent

Follow the pattern in `src/agents/assistant.agent.ts`:

```typescript
import { Agent, Memory, AiSdkEmbeddingAdapter } from "@voltagent/core"
import { google } from "@ai-sdk/google"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltlogger } from "../config/logger.js"
import z from "zod"

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
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
})

export const newAgent = new Agent({
  id: "agent-id",
  name: "Agent Name",
  purpose: "Clear description of agent's role and responsibilities",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: `Detailed system prompt...`,
  tools: [],
  toolkits: [],
  memory: agentMemory,
  maxHistoryEntries: 100,
  temperature: 0.7,
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: false,
  logger: voltlogger,
})
```

### Creating a New Tool

Use `createTool()` with Zod schema validation:

```typescript
import { createTool } from "@voltagent/core"
import z from "zod"
import { voltlogger } from "../config/logger.js"

export const myTool = createTool({
  name: "tool_name",
  description: "What this tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation was cancelled")
    }
    
    voltlogger.info(`Tool executed with param: ${args.param}`)
    return `Result: ...`
  },
})
```

### Creating a Workflow

Use `createWorkflowChain()` with Zod schemas:

```typescript
import { createWorkflowChain } from "@voltagent/core"
import z from "zod"

const workflow = createWorkflowChain({
  id: "workflow-id",
  name: "Workflow Name",
  purpose: "Detailed description",
  input: z.object({ topic: z.string() }),
  result: z.object({ text: z.string() }),
})
  .andThen({
    id: "step-one",
    execute: async ({ data }) => {
      const { topic } = data
      return { result: "..." }
    },
  })
  .andThen({
    id: "step-two",
    execute: async ({ data, getStepData }) => {
      const prevData = getStepData("step-one")
      return { final: "..." }
    },
  })
```

## Logging

Use `voltlogger` from `./config/logger.ts` throughout the application:

```typescript
import { voltlogger } from "./config/logger.js"

voltlogger.info("Information message")
voltlogger.error("Error message", { errorData })
voltlogger.trace("Detailed trace information")
voltlogger.warn("Warning message")
voltlogger.debug("Debug information")
```

The logger is configured with:

- Pino backend
- Log level: trace (all messages)
- Service name: "Voltlogger"
- Custom serializers for request objects
- Custom logging hooks

## Error Handling

- **Throw Errors**: Use `throw new Error("Clear message")` for synchronous operations
- **Async Errors**: Let errors bubble up or use try-catch
- **Context Cancellation**: Check `context?.isActive` before tool execution
- **Logging**: Log errors with context before throwing

## VoltOps & Observability

The project integrates with VoltOps for monitoring and observability:

### Trace Collection

- **Storage**: LibSQL database in `.voltagent/observability.db`
- **Sampling**: 50% ratio (adjust `sampling.ratio` if needed)
- **Batching**: 512 events max, 4-second flush interval

### Enable Observability

```typescript
import { VoltAgentObservability } from "@voltagent/core"
import { LibSQLObservabilityAdapter } from "@voltagent/libsql"

const observability = new VoltAgentObservability({
  serviceName: "Mastervolt",
  storage: new LibSQLObservabilityAdapter({
    url: "file:./.voltagent/observability.db",
  }),
  logger: voltlogger,
  voltOpsSync: {
    sampling: { strategy: "ratio", ratio: 0.5 },
    maxQueueSize: 4096,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 4000,
  },
})
```

## MCP (Model Context Protocol) Integration

### Available MCP Servers

Defined in `src/config/mcp.ts` (client) and `src/config/mcpserver.ts` (server):

- **Filesystem** (stdio): Local file system access
- **Hugging Face** (HTTP): `https://huggingface.co/mcp` with Bearer token auth

### Using MCP Tools

```typescript
const mcpConfig = new MCPConfiguration({
  servers: {
    filesystem: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "<path>"]
    },
  },
})

// Get all available tools from MCP servers
const tools = await mcpConfig.getTools()

// Use in agent
const agent = new Agent({
  tools: tools,
  // ... rest of config
})
```

## Security

### Secrets Management

- Never commit API keys, secrets, or credentials to the repository
- Always use environment variables for sensitive data
- Use `.env` for local development (add `.env` to `.gitignore`)
- Reference `.env.example` for required variables
- Validate all environment variables on startup

### Best Practices

- Use input validation with Zod schemas on all user inputs
- Check `context?.isActive` to respect operation cancellation
- Don't expose sensitive information in error messages
- Regularly update dependencies: `npm update`
- Use strict TypeScript mode to catch type-related security issues

## Debugging

### Enable Trace Logging

The logger is configured with `level: "trace"` to show all details:

```typescript
voltlogger.trace("Detailed diagnostic information")
```

### Inspect Context in Tools

```typescript
export const debugTool = createTool({
  execute: async (args, context) => {
    voltlogger.info(`Operation ID: ${context?.operationId}`)
    voltlogger.info(`User ID: ${context?.userId}`)
    voltlogger.info(`Conversation ID: ${context?.conversationId}`)
    voltlogger.info(`Original input: ${context?.input}`)
  }
})
```

### Check OpenTelemetry Traces

Traces are stored in `.voltagent/observability.db`. The VoltOps dashboard will display:

- Agent execution times
- Tool invocation counts
- Error rates
- Memory usage patterns

## Troubleshooting

### Common Issues

#### Test Failures

- Use `npx vitest run -t "pattern"` to debug specific tests
- Check `tests/test-results/test-results.json` for detailed results

#### Agent Memory Not Persisting

- Check `.voltagent/` directory exists and has write permissions
- Verify database files: `assistant-memory.db`, `writer-memory.db`, `memory.db`
- Check logs for LibSQL connection errors

#### VoltOps Sync Not Working

- Verify `VOLTAGENT_PUBLIC_KEY` and `VOLTAGENT_SECRET_KEY` environment variables
- Check network connectivity to `console.voltagent.dev`
- Review traces in `.voltagent/observability.db`

## Performance Considerations

### Memory Optimization

- Set reasonable `maxHistoryEntries` (default: 100 for agents)
- Enable embedding cache: `enableCache: true`
- Use `maxSteps` to prevent infinite loops (default: 25)

### Token Management

- Set `maxOutputTokens` based on model capabilities
- Monitor token usage in VoltOps dashboard
- Adjust `temperature` to balance creativity vs consistency (default: 0.7)

### Concurrency

- Agents process tasks sequentially within a conversation
- Multiple conversations can run in parallel
- Use A2A module for agent-to-agent communication

## Quick Reference

### Essential Commands

```bash
npm run dev          # Start development server (watch mode)
npx vitest --watch          # Run tests in watch mode
npx vitest run -t "pattern"  # Run specific tests
npm test                    # Run all tests
npx vitest run --coverage   # Run all with coverage
npm run next                # Start Next.js dev server
npm run build:next          # Build Next.js app
npm run volt                # Run VoltAgent CLI
```

### Key Patterns

- **Agent Creation**: See `src/agents/assistant.agent.ts`
- **Tool Creation**: See `src/tools/debug-tool.ts`
- **Workflow Setup**: See `src/index.ts`
- **Logging**: Use `voltlogger` from `./config/logger.js`
- **Error Handling**: Check `context?.isActive`, throw descriptive errors

### Important Files

- `.env` - Environment variables (local only, not in git)
- `.env.example` - Template for required variables
- `src/index.ts` - Application entry point
- `src/config/` - Configuration modules
- `.voltagent/` - Runtime data (auto-created at startup)
- `dist/` - Compiled JavaScript (auto-created by build)

## Version Information

| Component | Version | Purpose |
| --- | --- | --- |
| TypeScript | 5.9.3 | Language and compilation |
| Node.js | 18+ | Runtime environment |
| VoltAgent | 2.1.3 | Multi-agent orchestration |
| Vitest | 4.0.17 | Testing framework |
| Google AI SDK | 3.0.10 | Gemini model integration |
| OpenAI SDK | 3.0.12 | OpenAI model integration |
| Zod | 4.1.13 | Schema validation |
| Prettier | 3.8.0 | Code formatting |
| ESLint | 9.39.2 | Code linting |

## Additional Resources

- **VoltAgent Documentation**: <https://voltagent.dev/docs/>
- **AI SDK Documentation**: <https://sdk.vercel.ai/docs>
- **TypeScript Handbook**: <https://www.typescriptlang.org/docs/>
- **Zod Validation**: <https://zod.dev/>
- **Vitest Guide**: <https://vitest.dev/guide/>

---

**Last Updated**: January 2026
**Project**: Mastervolt Deep Research
**Framework**: VoltAgent v2.1.3
**Language**: TypeScript 5.9.3
