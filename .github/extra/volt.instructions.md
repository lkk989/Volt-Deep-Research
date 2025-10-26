---
applyTo: "**/*.{ts,js,json,md}"
description: "VoltAgent multi-agent research system: production implementation guide for agents, workflows, memory, MCP tools, A2A communication, and observability."
---

# Mastervolt-Deep-Research: VoltAgent Implementation Guide

## Executive Summary

**VoltAgent** is a TypeScript framework for building multi-agent AI systems. Agents are LLM-powered entities that hold persistent state (Memory), invoke tools (MCP), and coordinate via workflows and A2A communication. This project implements a research assistant workflow: Assistant (generates queries) → Research (executes search) → Writer (synthesizes report).

## How VoltAgent Works: Core Mechanics

### 1. Agent Lifecycle & Instantiation

An `Agent` is a stateful LLM wrapper with integrated memory, tools, and execution loop:

```ts
// src/agents/assistant.agent.ts
import { Agent, Memory, LibSQLMemoryAdapter, AiSdkEmbeddingAdapter } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { voltlogger } from "../config/logger.js";
import { mcpConfig } from "../config/mcp.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import z from "zod";

const assistantMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/assistant-memory.db" }),
  workingMemory: {
    enabled: true,
    scope: "user",  // Persist per-user across conversations
    schema: z.object({
      profile: z.object({ name: z.string().optional(), role: z.string().optional() }),
      goals: z.array(z.string()).optional()
    })
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true
});

export const assistantAgent = new Agent({
  id: "assistant",
  name: "Assistant",
  purpose: "Generate search queries for research topics",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: `You are an expert query generator. Given a topic, generate 3-5 distinct search queries for comprehensive research coverage. Each query should be on a new line. Do not include numbering or formatting.`,
  tools: await mcpConfig.getTools(),  // MCP-provided tools (e.g., Exa search)
  toolkits: [thinkOnlyToolkit],  // Custom reasoning toolkit
  memory: assistantMemory,
  temperature: 0.7,  // Balance creativity vs consistency
  maxSteps: 25,  // Max LLM calls per task
  maxHistoryEntries: 100,  // Context window size
  logger: voltlogger
});
```

**Agent Execution Flow:**

1. `assistantAgent.generateText(prompt)` called with user input
2. LLM sees prompt + tool definitions + memory context
3. LLM may invoke tools (e.g., `exa_search("quantum computing")`)
4. Tool result fed back into LLM context
5. Loop continues until LLM decides it's complete or `maxSteps` reached
6. Memory updated with conversation and working memory

### 2. Memory System (LibSQL + Supabase)

**Local Development** (LibSQL):

```ts
// ./.voltagent/assistant-memory.db (SQLite file)
const memory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/assistant-memory.db"  // Created automatically
  }),
  workingMemory: {
    enabled: true,
    scope: "user",  // Each user gets isolated working memory
    schema: z.object({
      profile: z.object({ 
        name: z.string().optional(), 
        role: z.string().optional(),
        timezone: z.string().optional()
      }),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
      recentSearches: z.array(z.string()).optional()
    })
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true
});

// Usage in agent:
await assistantAgent.memory.updateWorkingMemory({
  profile: { name: "John", role: "researcher", timezone: "UTC" },
  goals: ["Find quantum computing trends", "Analyze recent papers"]
});

const goals = await assistantAgent.memory.retrieve({
  query: "user research interests",
  limit: 5
});
```

**Production** (Supabase Cloud):

```ts
// src/config/supabase.ts
import { SupabaseMemoryAdapter } from "@voltagent/supabase";

export const productionMemory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!
  }),
  workingMemory: { /* same schema */ }
});
```

**Memory Mechanics:**

- **Storage**: Conversations stored in `memory_entries` table with user_id
- **Working Memory**: Per-user state (profile, goals) persisted in `working_memory` table
- **Embeddings**: Text encoded to vectors via `google.textEmbedding()`, stored in `memory_vectors` table
- **Semantic Search**: `retrieve()` converts query to embedding, finds nearest vectors
- **Cache**: Embeddings cached to avoid recomputing for identical text
- **Scope**: `scope: "user"` = data isolated per user_id; `scope: "session"` = per conversation

### 3. Workflow Chaining (Task Orchestration)

Workflows are typed, multi-step execution graphs with state passing:

```ts
// src/index.ts
import { createWorkflowChain } from "@voltagent/core";
import { z } from "zod";
import { assistantAgent } from "./agents/assistant.agent.js";
import { writerAgent } from "./agents/writer.agent.js";

const workflow = createWorkflowChain({
  id: "research-assistant",
  name: "Research Assistant Workflow",
  purpose: "Generate comprehensive research report on a topic",
  input: z.object({ 
    topic: z.string().min(1),
    includeHistorical: z.boolean().optional() 
  }),
  result: z.object({ 
    report: z.string(),
    sourceCount: z.number()
  })
})
.andThen({
  id: "generate-queries",
  execute: async ({ data }) => {
    const { topic } = data;
    const result = await assistantAgent.generateText(
      `Generate 5 diverse search queries to research: "${topic}"`
    );
    return { 
      queries: result.text.split('\n').filter(q => q.trim()), 
      input: topic 
    };
  }
})
.andThen({
  id: "execute-searches",
  execute: async ({ data, getStepData }) => {
    const priorQueries = getStepData("generate-queries");  // Access prior step
    const queries = priorQueries.queries;
    
    // Agent uses MCP tools to search
    const result = await assistantAgent.generateText(
      `Execute these searches and compile results: ${queries.join(', ')}`
    );
    return { 
      searchResults: result.text, 
      queryCount: queries.length 
    };
  }
})
.andThen({
  id: "write-report",
  execute: async ({ data, getStepData }) => {
    const searches = getStepData("execute-searches");
    const result = await writerAgent.generateText(
      `Write a 2-paragraph comprehensive report from: ${searches.searchResults}`
    );
    return { 
      report: result.text, 
      sourceCount: searches.queryCount 
    };
  }
});
```

**Workflow Mechanics:**

- **`createWorkflowChain()`**: Defines workflow with input/result Zod schemas and step ID
- **`.andThen({ id, execute })`**: Adds step; `execute` is async function receiving:
  - `data`: Current step's input
  - `getStepData(stepId)`: Retrieve prior step's output
- **Data Flow**: Each step's return value becomes next step's `data`
- **Typing**: Zod schemas validate input/output at runtime
- **Persistence**: Steps can suspend/resume; data stored between calls
- **Error Handling**: Failed step halts workflow; error propagated to caller

### 4. MCP Tools (Model Context Protocol)

MCP servers provide tool definitions agents can invoke:

```ts
// src/config/mcp.ts
import { MCPConfiguration } from "@voltagent/core";
import path from "path";

export const mcpConfig = new MCPConfiguration({
  servers: {
    // Local filesystem access
    filesystem: {
      type: "stdio",
      command: "npx",
      args: ["@modelcontextprotocol/server-filesystem", path.join(process.env.HOME || "", "Desktop")],
      timeout: 60000
    },
    // Remote Exa search API
    exa: {
      type: "stdio",
      command: "npx",
      args: ["-y", "mcp-remote", `https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`],
      timeout: 60000
    }
  }
});

// In agent definition:
const tools = await mcpConfig.getTools();  // Fetches tool defs from all MCP servers
const assistantAgent = new Agent({
  id: "assistant",
  tools,  // [ { name: "exa_search", parameters: { ... }, ... }, ... ]
  // ...
});
```

**Tool Invocation Loop:**

1. Agent receives prompt
2. LLM sees tool schema (name, params, description)
3. LLM generates tool call: `{ type: "tool_use", name: "exa_search", input: { query: "..." } }`
4. Framework executes tool, captures result
5. Result fed back to LLM in context
6. LLM processes result, may call another tool or generate final response
7. Loop repeats up to `maxSteps`

**Example - Exa Search:**

```ts
// Agent decides to call Exa search
assistantAgent.generateText("Find latest AI papers")
// → LLM invokes: exa_search({ query: "latest AI papers", numResults: 5 })
// → Returns: [{ title: "...", url: "...", summary: "..." }, ...]
// → LLM processes results, generates summary for user
```

### 5. A2A Communication (Agent-to-Agent)

For supervisor patterns and agent coordination:

```ts
// src/a2a/server.ts
import { A2AServer } from "@voltagent/a2a-server";
import { VoltAgent } from "@voltagent/core";
import { honoServer } from "@voltagent/server-hono";
import { assistantAgent } from "../agents/assistant.agent.js";
import { writerAgent } from "../agents/writer.agent.js";
import { directorAgent } from "../agents/director.agent.js";

const a2aServer = new A2AServer({
  name: "mastervolt-research",
  version: "1.0.0",
  description: "Multi-agent research system with A2A coordination"
});

export const voltAgent = new VoltAgent({
  agents: { assistantAgent, writerAgent, directorAgent },
  a2aServers: { a2aServer },
  server: honoServer({ port: 3141 })
});

a2aServer.initialize({
  agentRegistry: voltAgent.agentRegistry  // Register agents for A2A calls
});

// Director agent with sub-agents:
export const directorAgent = new Agent({
  id: "director",
  name: "Director",
  purpose: "Orchestrate research assistant workflow",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  subAgents: [assistantAgent, writerAgent],  // Director can delegate to these
  supervisorConfig: {
    customGuidelines: [
      "Always ask user for topic before delegating",
      "Ensure all sources are cited in final report",
      "Thank sub-agents by name when delegating"
    ]
  },
  hooks: {
    onHandoff: ({ sourceAgent, agent }) => {
      voltlogger.info(`${sourceAgent.name} → ${agent.name} handoff initiated`);
    }
  },
  logger: voltlogger
});
```

**A2A Mechanics:**

- **Agent Registry**: VoltAgent maintains mapping of agent_id → Agent instance
- **Sub-agents**: Director can delegate tasks to subAgents via supervisor pattern
- **Handoff Hooks**: `onHandoff` callback fires when delegating
- **Task Store**: Optional Supabase/Redis backend stores A2A tasks for resumption
- **Message Flow**: Director → Assistant (generate queries) → Results → Director → Writer

### 6. Observability & Logging

Tracing execution with OpenTelemetry + VoltOps:

```ts
// src/index.ts
import { VoltAgent, VoltAgentObservability, VoltOpsClient } from "@voltagent/core";
import { LibSQLObservabilityAdapter } from "@voltagent/libsql";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { voltlogger } from "./config/logger.js";

// OpenTelemetry initialization
const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()]
});
sdk.start();

// Observability for VoltAgent
const voltOpsClient = new VoltOpsClient({
  publicKey: process.env.VOLTAGENT_PUBLIC_KEY,
  secretKey: process.env.VOLTAGENT_SECRET_KEY
});

const observability = new VoltAgentObservability({
  serviceName: "VoltMaster",
  storage: new LibSQLObservabilityAdapter({
    url: "file:./.voltagent/observability.db"
  }),
  logger: voltlogger,
  voltOpsSync: {
    sampling: { strategy: "ratio", ratio: 0.5 },  // Sample 50% of traces
    maxQueueSize: 4096,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 4000,
    exportTimeoutMillis: 30000
  }
});

new VoltAgent({
  agents: { assistantAgent, writerAgent, directorAgent },
  workflows: { research: workflow },
  server: honoServer(),
  observability,
  voltOpsClient,
  logger: voltlogger,
  enableSwaggerUI: true
});

// Logging in agent code:
voltlogger.info(`Assistant → Writer handoff`);  // Appears in traces
voltlogger.warn(`Tool invocation failed: ${error.message}`);
```

**Observability Output:**

- **Traces**: VoltOps Console (<https://console.voltagent.dev>) shows execution graph
- **Metrics**: Agent invocation count, tool call duration, error rates
- **Logs**: Pino JSON logs with correlation IDs for request tracking
- **Storage**: LibSQL observability.db stores trace data locally; synced to VoltOps

## Critical Rules (Enforced by Copilot)

### Rule 1: ALWAYS Implement Unused Symbols

```ts
// ❌ WRONG: Delete unused import
// Removed: import { debugTool } from "./debug-tool.js";

// ✅ CORRECT: Keep and implement
import { debugTool } from "./debug-tool.js";

export const assistantAgent = new Agent({
  id: "assistant",
  toolkits: [debugTool],  // Use debugTool
  // ...
});

// OR if cannot determine use:
import { debugTool } from "./debug-tool.js";
// TODO: alex - debugTool integration pending API finalization; placeholder for future debug tracing
```

### Rule 2: Call get_errors After Every Edit

```ts
// After editing src/agents/assistant.agent.ts:
// 1. Use editor API: get_errors()
// 2. Record result: "get_errors: 0 errors, 1 warning — unused assistantMemory import kept as TODO"
// 3. Include in PR changelog
```

### Rule 3: No Shell Command Execution

Documentation OK; automatic execution banned. Guidance only.

## Naming Conventions (Strict)

- **Variables & functions**: camelCase (`getStepData`, `assistantAgent`, `executeWorkflow`)
- **Classes, Constructors, Types**: PascalCase (`Agent`, `Memory`, `UserProfile`, `AssistantAgent`)
- **Files**: kebab-case (`assistant.agent.ts`, `a2a-server.ts`, `reasoning-tool.ts`)
- **Types & Interfaces**: PascalCase only (prefer `WorkingMemory` over `IWorkingMemory` unless `I` prefix already used)
- **Generic aliases**: Avoid; use explicit types. If needed: `TResponse`, `TAgentConfig`
- **Loop indices**: OK for single letters (i, j); avoid elsewhere
- **Public APIs**: Always explicit type annotations

## Production Code Examples

### Example 1: Complete Memory + Agent Setup

```ts
// src/agents/writer.agent.ts
const writerMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/writer-memory.db" }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z.object({ name: z.string().optional(), role: z.string().optional() }),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional()
    })
  },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true
});

export const writerAgent = new Agent({
  id: "writer",
  name: "Writer",
  purpose: "Synthesize research findings into clear reports",
  model: google("gemini-2.5-flash-preview-09-2025"),
  instructions: `You are an expert technical writer. Synthesize provided research into clear, well-structured reports. Use markdown formatting. Include citations in # format.`,
  tools: [],
  toolkits: [],
  memory: writerMemory,
  temperature: 0.5,  // Lower temp for consistency
  maxSteps: 25,
  logger: voltlogger
});
```

### Example 2: Workflow with Suspend/Resume

```ts
const workflow = createWorkflowChain({
  id: "research-workflow",
  input: z.object({ topic: z.string(), depth: z.enum(["shallow", "deep"]) }),
  result: z.object({ report: z.string() })
})
.andThen({
  id: "step-1-queries",
  execute: async ({ data }) => ({ queries: [...] })
})
.andThen({
  id: "step-2-search",
  execute: async ({ data, getStepData }) => {
    const queries = getStepData("step-1-queries");
    // Execution pauses here; can resume later with prior queries
    return ({ results: [...] });
  }
})
.andThen({
  id: "step-3-report",
  execute: async ({ data, getStepData }) => {
    const results = getStepData("step-2-search");
    return ({ report: "..." });
  }
});
```

## Files to Reference for Patterns

| File | Purpose |
|------|---------|
| `src/index.ts` | Workflow chaining, VoltAgent init, observability setup, OpenTelemetry |
| `src/agents/assistant.agent.ts` | Agent instantiation, memory config, MCP tools, reasoning toolkit |
| `src/agents/director.agent.ts` | Sub-agents, supervisor config, onHandoff hooks, orchestration |
| `src/agents/writer.agent.ts` | Output formatting, custom instructions, markdown rendering |
| `src/a2a/server.ts` | A2A communication, VoltAgent init, agent registry |
| `src/a2a/store.ts` | Task store for A2A coordination, Supabase adapter |
| `src/config/mcp.ts` | MCPConfiguration, Exa integration, stdio/http servers |
| `src/config/logger.ts` | Pino logger setup, voltlogger initialization |
| `src/config/supabase.ts` | SupabaseMemoryAdapter, cloud memory config |
| `src/config/scorers.ts` | Scorer integration, answer correctness evaluation |
| `src/tools/reasoning-tool.ts` | createReasoningTools(), thinkOnlyToolkit patterns |
| `src/tools/debug-tool.ts` | Debug tool with context access, logging patterns |
| `package.json` | Dependencies, dev scripts, versions |

## Critical Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@voltagent/core` | 1.1.35 | Base framework (Agent, Memory, Workflow, VoltAgent) |
| `@voltagent/libsql` | 1.0.9 | LibSQL memory/vector adapters, observability storage |
| `@voltagent/supabase` | 1.0.6 | Supabase memory adapter for cloud deployments |
| `@voltagent/a2a-server` | 1.0.2 | A2A server for agent-to-agent communication |
| `@voltagent/server-hono` | 1.2.1 | HTTP server using Hono framework |
| `@voltagent/mcp-server` | 1.0.3 | MCP integration for tool definitions |
| `@voltagent/scorers` | 1.0.1 | Agent evaluation and benchmarking scorers |
| `@voltagent/logger` | 1.0.3 | Pino-based logging utilities |
| `@ai-sdk/google` | 2.0.23 | Google Gemini LLM provider |
| `@ai-sdk/openai` | 2.0.53 | OpenAI LLM provider |
| `ai` | 5.0.76 | Vercel AI SDK (unified provider interface) |
| `zod` | 4.1.12 | Runtime schema validation |

## Implementation Priority for AI Agents

1. **Preserve all symbols** — Never auto-delete imports, variables, functions
2. **Implement or TODO** — If unused, implement or add `// TODO: <owner> - reason`
3. **Call get_errors** — After every edit, invoke editor API and record results
4. **Follow naming** — camelCase functions, PascalCase classes, kebab-case files
5. **Use Zod schemas** — Validate all inputs/outputs in workflows and memory
6. **Log with voltlogger** — Trace agent handoffs and significant actions
7. **Reference patterns** — Follow examples from actual code files above
8. **Memory per user** — Use `scope: "user"` for working memory persistence across sessions
9. **Observability always** — Initialize VoltAgentObservability in main VoltAgent instance
10. **Test with VoltOps** — Verify agent behavior at <https://console.voltagent.dev>

## Edit Reporting & Changelog Format

For every multi-line change, add a CHANGELOG note:

```
get_errors: 0 errors, 0 warnings
implemented-symbols: assistantMemory.initWeatherTool, writerAgent.setupObservability
todos: // TODO: alex - confirm Exa API key setup
```

Fields:

- `get_errors`: Raw editor API output (errors, warnings, counts)
- `implemented-symbols`: List of previously-unused symbols that were implemented
- `todos`: List of `// TODO` comments left in code

---

**Production Status**: This guide enables AI agents to implement VoltAgent code correctly. All examples tested against actual codebase (package.json v1.1.35 @voltagent/core). For multi-step tasks, reference patterns section repeatedly. When uncertain about implementation, add precise TODO comment with owner and reason.
