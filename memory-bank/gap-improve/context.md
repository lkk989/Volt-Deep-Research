# Context: Gap-improve

## Current Status

**Phase**: PRD_INTAKE → NEEDS REVISION  
**Created**: 2025-11-27  
**Last Updated**: 2025-11-28  
**Research Completed**: VoltAgent v1.1.30+ documentation fully reviewed

---

## ⚠️ Critical Findings from VoltAgent Documentation Research

After extensive research of VoltAgent documentation, examples, and source patterns, several assumptions in the original gap analysis were **incorrect**. This document now reflects accurate patterns.

---

## Gap Analysis Summary (CORRECTED)

### A2A Server Gaps

| Current Issue | Correct VoltAgent Pattern | Priority | Effort |
|---------------|---------------------------|----------|--------|
| Manual `agentRegistry` wrapper | VoltAgent auto-registers agents when passed to `VoltAgent({ agents })` | High | S |
| `(this.adapter as any).get/set` in SupaTaskStore | Must implement `TaskStore` interface with `load/save` - SupabaseMemoryAdapter is for Memory, NOT TaskStore | Critical | M |
| No `filterAgents` | Optional - use when exposing subset of agents to A2A | Low | XS |

**Current Code Problem (src/a2a/store.ts):**

```typescript
// WRONG: SupabaseMemoryAdapter is for agent Memory, not A2A TaskStore
export class SupaTaskStore implements TaskStore {
  private adapter = new SupabaseMemoryAdapter({ ... });
  async load({ agentId, taskId }): Promise<TaskRecord | null> {
    const raw = await (this.adapter as any).get(`${agentId}::${taskId}`);
    // SupabaseMemoryAdapter has NO .get() method - this will fail!
  }
}
```

**Correct Pattern (from VoltAgent docs):**

```typescript
// Use Supabase client directly for A2A TaskStore
import { createClient } from "@supabase/supabase-js";
import type { TaskRecord, TaskStore } from "@voltagent/a2a-server";

export class SupabaseTaskStore implements TaskStore {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

  async load({ agentId, taskId }): Promise<TaskRecord | null> {
    const { data } = await this.supabase
      .from("a2a_tasks")
      .select("*")
      .eq("agent_id", agentId)
      .eq("task_id", taskId)
      .single();
    return data ? (data as TaskRecord) : null;
  }

  async save({ agentId, data }: { agentId: string; data: TaskRecord }): Promise<void> {
    await this.supabase.from("a2a_tasks").upsert({
      agent_id: agentId,
      task_id: data.id,
      ...data,
    });
  }
}
```

**Current Code Problem (src/a2a/server.ts):**

```typescript
// UNNECESSARY: VoltAgent auto-creates registry when agents are passed
a2aServer.initialize({
  agentRegistry: {
    getAgent: (id: string) => voltAgent.getAgent(id),
    getAllAgents: () => voltAgent.getAgents(),
  },
});
```

**Correct Pattern (from with-a2a-server example):**

```typescript
// VoltAgent handles registry automatically
const a2aServer = new A2AServer({
  name: "support-agent",
  version: "0.1.0",
  description: "VoltAgent A2A example",
  // Optional: filterAgents to expose subset
  // filterAgents: ({ items }) => items.filter(a => !a.id.includes("internal")),
});

new VoltAgent({
  agents: { assistant },
  a2aServers: { a2aServer },
  server: honoServer({ port: 3141 }),
});
// No manual initialize needed!
```

---

### Retriever Gaps

| Current Issue | Correct VoltAgent Pattern | Priority | Effort |
|---------------|---------------------------|----------|--------|
| `retriever: undefined` on all agents | Implement `BaseRetriever.retrieve()` method | High | M |
| Empty `src/retriever/` folder | Create retriever class extending `BaseRetriever` | High | M |
| No semantic context for research | Use existing LibSQL vector store for similarity search | Medium | S |

**Correct Pattern (from with-retrieval example & custom-retrievers.md):**

```typescript
import { BaseRetriever, type BaseMessage, type RetrieveOptions } from "@voltagent/core";

export class ResearchRetriever extends BaseRetriever {
  constructor() {
    super({
      toolName: "search_research_memory",
      toolDescription: "Search through previous research findings and context",
    });
  }

  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    // Extract search text
    const searchText = typeof input === "string" 
      ? input 
      : this.extractTextFromMessages(input);

    // Perform search (using existing vector store)
    const results = await this.searchVectorStore(searchText, options);

    // Track sources in context
    if (options.context && results.length > 0) {
      options.context.set("sources", results.map(r => ({
        title: r.title,
        source: r.source,
        score: r.score,
      })));
    }

    return results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join("\n\n---\n\n");
  }
}

// Usage in agent:
const agent = new Agent({
  retriever: new ResearchRetriever(), // Always retrieves before response
  // OR
  tools: [new ResearchRetriever().tool], // LLM decides when to search
});
```

---

### Guardrails Gaps

| Current Issue | Correct VoltAgent Pattern | Priority | Effort |
|---------------|---------------------------|----------|--------|
| `inputGuardrails: []` | Use built-in factories + custom guardrails | High | M |
| `outputGuardrails: []` | Use built-in PII/safety guardrails + streaming | High | M |
| No streaming redaction | Use `streamHandler` for real-time sanitization | Medium | S |

**Correct Built-in Guardrails (from guardrails/built-in.md):**

```typescript
import {
  createDefaultInputSafetyGuardrails,
  createDefaultPIIGuardrails,
  createDefaultSafetyGuardrails,
  createMaxLengthGuardrail,
  createOutputGuardrail,
  createInputGuardrail,
} from "@voltagent/core";

// Input: blocks profanity, PII, prompt injection, sanitizes HTML
const inputGuardrails = createDefaultInputSafetyGuardrails();

// Output: redacts numbers, emails, phones + profanity filter
const piiGuardrails = createDefaultPIIGuardrails();
const safetyGuardrails = createDefaultSafetyGuardrails({
  profanity: { mode: "redact" },
  maxLength: { maxCharacters: 10000 },
});

const agent = new Agent({
  inputGuardrails,
  outputGuardrails: [...piiGuardrails, ...safetyGuardrails],
});
```

**Custom Output Guardrail with Streaming (from with-guardrails example):**

```typescript
const citationGuardrail = createOutputGuardrail({
  id: "citation-format",
  name: "Citation Format Enforcer",
  
  // Handler runs after streaming completes
  handler: async ({ output }) => {
    if (typeof output !== "string") return { pass: true };
    
    // Validate citation format [1], [2], etc.
    const citationPattern = /\[\d+\]/g;
    const hasCitations = citationPattern.test(output);
    
    return {
      pass: true,
      metadata: { hasCitations, citationCount: (output.match(citationPattern) || []).length },
    };
  },

  // streamHandler runs on each chunk
  streamHandler: ({ part, state }) => {
    if (part.type !== "text-delta") return part;
    const chunk = part.delta ?? part.text ?? "";
    // Real-time processing here
    return { ...part, delta: chunk, text: undefined };
  },
});
```

---

### Hooks Gaps

| Current Issue | Correct VoltAgent Pattern | Priority | Status |
|---------------|---------------------------|----------|--------|
| `onStart`, `onEnd` | ✅ Implemented correctly | - | Done |
| `onToolStart`, `onToolEnd` | ✅ Implemented correctly | - | Done |
| `onPrepareMessages` | ✅ Implemented (returns `{ messages }`) | - | Done |
| `onPrepareModelMessages` | Missing - provider-specific transforms | Medium | Needed |
| `onError` | Missing - dedicated error hook | Medium | Needed |
| `onStepFinish` | Missing - per-step observability | Low | Optional |
| `onHandoff` | ✅ Implemented in director | - | Done |

**Missing Hooks Pattern (from agents/hooks.md):**

```typescript
const hooks = createHooks({
  // After UI messages converted to provider format
  onPrepareModelMessages: async ({ modelMessages, uiMessages }) => {
    // Inject system message if missing
    if (!modelMessages.some(msg => msg.role === "system")) {
      return {
        modelMessages: [
          { role: "system", content: [{ type: "text", text: "Research safety guidelines" }] },
          ...modelMessages,
        ],
      };
    }
    return {};
  },

  // Dedicated error handling
  onError: async ({ agent, error, context }) => {
    voltlogger.error(`[${context.operationId}] ${agent.name} error: ${error.message}`, {
      stack: error.stack,
      userId: context.userId,
    });
  },

  // Per-step observability
  onStepFinish: async ({ agent, step, context }) => {
    voltlogger.debug(`[${context.operationId}] Step completed`, {
      stepNumber: step.stepNumber,
      toolsUsed: step.toolInvocations?.length ?? 0,
    });
  },
});
```

---

### Agent Gaps

| Current Issue | Correct VoltAgent Pattern | Priority | Effort |
|---------------|---------------------------|----------|--------|
| 7 agents configured | ✅ Good coverage | - | Done |
| No retriever on any agent | Add to research agents | High | S |
| No guardrails on any agent | Add to all agents | High | S |
| Missing specialized agents | Consider based on research needs | Medium | M |

**Agent Enhancement Pattern:**

```typescript
export const assistantAgent = new Agent({
  // ... existing config
  
  // ADD: Retriever for context
  retriever: new ResearchRetriever(),
  
  // ADD: Input guardrails
  inputGuardrails: createDefaultInputSafetyGuardrails(),
  
  // ADD: Output guardrails
  outputGuardrails: [
    ...createDefaultPIIGuardrails(),
    createMaxLengthGuardrail({ maxCharacters: 10000 }),
  ],
  
  // ENHANCE: Hooks with error handling
  hooks: createSharedHooks("assistant"),
});
```

---

## Existing Infrastructure (Verified)

### Memory Configuration ✅

Current pattern is correct and follows VoltAgent best practices:

```typescript
const agentMemory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/{agent}-memory.db" }),
  workingMemory: { enabled: true, scope: "user", schema: z.object({...}) },
  embedding: new AiSdkEmbeddingAdapter(google.textEmbedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000,
});
```

### Hook Configuration ✅

Current pattern is mostly correct, needs `onError` and `onPrepareModelMessages`:

```typescript
hooks: {
  onStart: async ({ agent, context }) => { ... },
  onEnd: async ({ agent, output, error, context }) => { ... },
  onToolStart: async ({ tool, context }) => { ... },
  onToolEnd: async ({ tool, error, context }) => { ... },
  onPrepareMessages: async ({ messages }) => { return { messages }; },
  onHandoff: async ({ agent, sourceAgent }) => { ... },
  // MISSING: onError, onPrepareModelMessages, onStepFinish
}
```

### Available Toolkits ✅

All toolkits properly implemented:

- `reasoning-tool.ts` - `thinkOnlyToolkit`, `analyzeOnlyToolkit`
- `web-scraper-toolkit.ts` - 5 tools for web extraction
- `arxiv-toolkit.ts` - Academic paper search
- `knowledge-graph-toolkit.ts` - Entity relationship management
- `data-conversion-toolkit.ts` - Format conversion
- `filesystem-toolkit.ts` - File operations

---

## Files to Create/Modify

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `src/retriever/research.retriever.ts` | BaseRetriever for research context | High |
| `src/retriever/index.ts` | Export retriever | High |
| `src/guardrails/input.guardrails.ts` | Input validation guardrails | High |
| `src/guardrails/output.guardrails.ts` | Output sanitization guardrails | High |
| `src/guardrails/index.ts` | Export guardrails | High |
| `src/hooks/shared.hooks.ts` | Shared hook factory | Medium |

### Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/a2a/store.ts` | Fix TaskStore implementation | Critical |
| `src/a2a/server.ts` | Remove manual registry wrapper | High |
| `src/agents/*.agent.ts` | Add retriever, guardrails, enhanced hooks | High |

---

## Key Decisions Needed

1. **TaskStore Backend**: Use Supabase directly vs create new table schema?
2. **Retriever Scope**: All agents or just research-focused agents?
3. **Guardrail Strictness**: Block vs mask for different content types?
4. **New Agents**: Knowledge Graph, Source Validator, Citation Manager - needed?

---

## Blockers

1. **SupabaseTaskStore**: Current implementation is non-functional - uses wrong adapter type
2. **No Supabase table schema**: Need to create `a2a_tasks` table if using Supabase

---

## VoltAgent Documentation References

| Topic | Doc Path | Notes |
|-------|----------|-------|
| A2A Server | `agents/a2a/a2a-server.md` | TaskStore interface, filterAgents |
| Guardrails Overview | `guardrails/overview.md` | handler vs streamHandler |
| Built-in Guardrails | `guardrails/built-in.md` | Factory functions |
| Hooks | `agents/hooks.md` | All 8 hook types |
| Custom Retrievers | `rag/custom-retrievers.md` | BaseRetriever pattern |
| Agent Overview | `agents/overview.md` | Full agent configuration |
| Sub-agents | `agents/subagents.md` | Supervisor config |

## VoltAgent Examples References

| Example | Key Learnings |
|---------|---------------|
| `with-a2a-server` | Minimal A2A setup, no manual registry |
| `with-guardrails` | Built-in + custom guardrails, streaming |
| `with-retrieval` | BaseRetriever implementation, tool mode |
| `with-hooks` | All hook types, messageHelpers |

---

**Phase Status**: PRD needs revision based on corrected analysis  
**Next Action**: Update PRD with accurate VoltAgent patterns
