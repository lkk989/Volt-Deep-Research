# Active Context: Mastervolt Deep Research

## Current Focus

**Multi-Agent Research System with Advanced Tooling & Security** - Enterprise-grade research orchestration with 14+ specialized agents, financial data toolkits, PDF processing, VoltAgent v2 guardrails, and comprehensive web scraping.

## Recent Changes

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
  - Tool routing with embeddings (gemini-embedding-001)

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
3. [ ] Enhance test coverage
4. [ ] Add evaluation experiments

## Current Blockers

_None at this time_

## Session Notes

- Memory Bank synchronized with current project state
- 14+ agents, 28 toolkits documented
- Guardrails implemented using VoltAgent v2 built-ins
- Free News APIs identified for implementation

---

_Last Updated: 2026-02-14_
