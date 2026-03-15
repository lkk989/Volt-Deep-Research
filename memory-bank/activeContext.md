# Active Context: Mastervolt Deep Research

## Current Focus

**Multi-Agent Research System with Advanced Tooling & Security** - Enterprise-grade research orchestration with 14+ specialized agents, financial data toolkits, PDF processing, VoltAgent v2 guardrails, and comprehensive web scraping.

## Recent Changes

### 2026-03-15

- **README Refresh**: Rewrote `README.md` to match the current runtime and frontend architecture, including updated package versions, direct VoltAgent chat transport details, workspace + skills coverage, refreshed dashboard surface description, explicit note that `chat-messages.tsx` is a typed render layer rather than a hook consumer, and GitHub-dark-mode Mermaid diagrams for platform architecture, streaming flow, and workspace/skills design
- **Model Refresh**: Updated agent defaults, plan orchestrators, live eval configs, and UI settings to `gemini-3.1-flash-lite-preview`
- **Embedding Refresh**: Migrated runtime embedding references to `gemini-embedding-2-preview` across agent routing, memory, retrievers, RAG tools, and workspace search
- **Migration Note**: `gemini-embedding-2-preview` uses an incompatible embedding space versus `gemini-embedding-001`; vector indexes must be rebuilt or re-embedded after deployment
- **Dashboard Chat Integration**: Strengthened the frontend chat pipeline around `useChat` + `DefaultChatTransport`, validated restored UI messages with `safeValidateUIMessages`, and expanded `chat-messages.tsx` support for richer ai-elements rendering
- **Dynamic Agent Chat Route**: Migrated the live chat surface to `app/dashboard/chat/[agentId]/page.tsx`, with `/dashboard/chat/page.tsx` serving as the agent-selection entry and all agent switching/navigation using path segments instead of `?agentId=` query params
- **Structured Part Rendering**: Added renderer support for `plan`, `task`, `queue`, and `chain-of-thought`-style `DataUIPart` payloads while keeping generic artifact/code-block fallback behavior for unknown data payloads
- **Workspace Tool Rendering**: Dashboard chat now adapts raw workspace toolkit outputs into rich ai-elements views for sandbox command execution, filesystem listings, workspace file reads, and workspace search results without requiring backend `{ type: ... }` wrappers
- **Direct VoltAgent Dashboard Data**: Dashboard agent list, chat header, and chat panel now consume built-in VoltAgent APIs through TanStack hooks instead of relying on the Next chat route proxy.
- **Agent-Driven Chat Navigation**: `/dashboard/agents` now lists real registered agents and links into `/dashboard/chat/[agentId]`, while the dynamic chat route binds directly to the selected runtime agent.
- **Prompt Attachments + Preview**: Chat input now uses ai-elements attachment actions, preview thumbnails, screenshot capture, and URL-based web preview; message submission follows AI SDK `sendMessage` overloads for text-only, files-only, and mixed prompts
- **Workflow Visualizer Consolidation**: Dashboard workflow views now share a typed `WorkflowVisualizer` built on ai-elements xyflow primitives (`Canvas`, `Node`, `Edge`, `Connection`, `Panel`, `Controls`, `Toolbar`) instead of duplicating graph logic across workflow canvas and execution surfaces
- **VoltAgent API Coverage Audit**: `lib/voltagent-client.ts` and `hooks/use-voltagent.ts` were expanded after auditing the installed `@voltagent/server-core` / `@voltagent/server-hono` route surface, adding broader typed coverage for agent history, workspace reads/skills, workflow runs/state, MCP server/resource/prompt detail routes, memory query routes, logs, and observability endpoints while correcting MCP list response unwrapping
- **TanStack Mutation Coverage**: The VoltAgent client/hook layer now includes typed mutation-capable helpers and hooks for non-streaming POST/PATCH/DELETE operations across agents, tools, workflow control, memory CRUD, MCP log-level/tool invocation, update installation, observability setup, and A2A JSON-RPC, with React Query result aliases and cache invalidation helpers
- **Route Surface Note**: The installed built-in VoltAgent server packages expose no dedicated `experiments` HTTP routes; experiments remain project-level code, not part of the bundled runtime API surface

### 2026-02-14

- **Tool Expansion**: Added 8+ new toolkits (stock-market, crypto-market, alpha-vantage, financial-analysis, statistical-analysis, content-transformation, github, pdf, token-analysis)
- **Agent Expansion**: Grown from 7 to 14+ specialized agents (coding, data-scientist, code-reviewer, content-curator, research-coordinator, judge, support)
- **Guardrails Implemented**: VoltAgent v2 built-in guardrails for security
  - Input: PII redaction, profanity filter, prompt injection detection, HTML sanitization
  - Output: sensitive numbers, emails, phones, max length
  - Quick setup: `createDefaultInputSafetyGuardrails()`, `createDefaultPIIGuardrails()`, `createDefaultSafetyGuardrails()`
- **Financial Data**: Stock market (Yahoo, Stooq - no API key), Crypto (Binance, DexScreener - no API key), Alpha Vantage
- **PDF Toolkit**: Text extraction, metadata, links, outline extraction
- **GitHub Integration**: Repository search, issues, PRs, code search

### News APIs Identified (No API Key Required)

- **The Free News API** (thefreenewsapi.com) - Completely free, 1 week history
- **NewsDataHub** (newsdatahub.com) - 50 req/day free tier
- **GitHub NewsAPI** (SauravKanchan/NewsAPI) - Open source, no key

### 2026-01-21

- **Landing Page Overhaul**: Significant update to hero, feature, and showcase components.
- **Scroll Sync**: Integrated Lenis smooth scrolling with GSAP ScrollTrigger.
- **Interactive UI**: Added `use-magnetic.ts` hook for interactive cursor behaviors.

## Active Decisions

### 1. Agent Architecture (14+ Agents)

- **PlanAgent (deepAgent)**: Main orchestrator supervising all sub-agents
  - Max Steps: 100
  - Max Output Tokens: 64000
  - Primary model: gemini-3.1-flash-lite-preview
  - Tool routing with embeddings (gemini-embedding-2-preview)

- **Sub-agents**:
  - assistant, writer, data-analyzer, data-scientist
  - fact-checker, synthesizer, scrapper
  - coding, code-reviewer, content-curator
  - research-coordinator, director, judge, support

### 2. Toolkit Organization (28 Toolkits)

**Market Data:**

- stock-market-toolkit.ts (Yahoo, Stooq - no key)
- crypto-market-toolkit.ts (Binance, DexScreener - no key)
- alpha-vantage-toolkit.ts (requires key)
- financial-analysis-toolkit.ts
- statistical-analysis-toolkit.ts
- token-analysis-toolkit.ts

**Research:**

- web-scraper-toolkit.ts (JSDOM, Cheerio, Turndown)
- arxiv-toolkit.ts
- pdf-toolkit.ts
- knowledge-graph-toolkit.ts
- rag-toolkit.ts

**Development:**

- code-analysis-toolkit.ts (ts-morph)
- git-toolkit.ts
- filesystem-toolkit.ts
- test-toolkit.ts
- github-toolkit.ts
- debug-tool.ts

**Data:**

- data-processing-toolkit.ts
- data-conversion-toolkit.ts
- visualization-toolkit.ts
- analyze-data-tool.ts
- content-transformation-toolkit.ts

**Utilities:**

- reasoning-tool.ts
- semantic-utils.ts
- weather-toolkit.ts
- api-integration-toolkit.ts

### 3. Guardrails Implementation (VoltAgent v2)

```typescript
// Input guardrails
inputGuardrails: createDefaultInputSafetyGuardrails()

// Output guardrails
outputGuardrails: [
    ...createDefaultPIIGuardrails(),
    createMaxLengthGuardrail({ maxCharacters: 500 }),
]
```

### 4. Memory Architecture

- Per-agent LibSQL databases (.voltagent/{agent-id}-memory.db)
- Shared vector store (.voltagent/memory.db)
- Working memory with Zod schemas
- Chroma retriever integration

## Next Steps

1. [ ] Implement News API toolkit
2. [ ] Add sentiment analysis toolkit
3. [ ] Add dashboard chat coverage for structured UI message rendering
4. [ ] Enhance test coverage
5. [ ] Add evaluation experiments
6. [ ] Add automated coverage for workspace-output chat rendering
7. [ ] Add automated coverage for workflow visualizer state/event rendering
8. [ ] Add automated coverage for VoltAgent client/hook route normalization and MCP response-shape handling
9. [ ] Add automated coverage for VoltAgent mutation hooks and cache invalidation behavior

## Current Blockers

_None at this time_

## Session Notes

- Memory Bank synchronized with current project state
- 14+ agents, 28 toolkits documented
- Guardrails implemented using VoltAgent v2 built-ins
- Free News APIs identified for implementation

---

_Last Updated: 2026-03-15_
