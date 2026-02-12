# AGENTS.md

Reference for `voltagent/tools/**`.

## Source of truth

If this file conflicts with implementation, code wins. Validate against:

1. tool exports in `voltagent/tools/*.ts`
2. consuming imports in `voltagent/agents/*.agent.ts`

## Tool architecture

This folder contains both patterns:

- **Toolkit pattern**: grouped `createToolkit(...)` exports
- **Single-tool pattern**: many direct `createTool(...)` exports

## Tool families and purpose

### Market data

#### `crypto-market-toolkit.ts` (single-tool exports)

Purpose: no-key crypto market data for analyzer/scientist workflows.

Includes tools for:

- spot price with provider fallback
- multi-source price consensus
- OHLCV candles
- Binance public market endpoints (exchange info, 24h ticker, book ticker, avg price, order book, recent trades, aggregate trades)
- DexScreener endpoints (search, pair, token pairs, token profiles, boosts)

Implementation notes:

- axios + axios-retry
- configurable request options (`timeoutMs`, `retries`, `retryDelayMs`)
- provider-aware errors and logging
- Kraken alias/candidate pair resolution for symbol compatibility

#### `stock-market-toolkit.ts` (single-tool exports)

Purpose: no-key stock market data using Yahoo + Stooq.

Includes tools for:

- spot price (Yahoo primary, Stooq fallback)
- batch quotes
- OHLCV chart bars
- Stooq daily history
- multi-source consensus price
- symbol search

Implementation notes:

- axios + axios-retry
- request options schema
- cancellation checks and structured outputs

#### `alpha-vantage-toolkit.ts` (toolkit)

Purpose: keyed market data series (intraday/daily/weekly/monthly).

- Requires `ALPHA_VANTAGE_API_KEY`

#### `financial-analysis-toolkit.ts`

Purpose: financial metrics and analysis helpers.

### Data and analytics

- `analyze-data-tool.ts`: direct analysis primitives
- `data-processing-toolkit.ts`: transforms and processing
- `data-conversion-toolkit.ts`: format conversion/parsing
- `visualization-toolkit.ts`: chart/visual helpers

### Retrieval, extraction, and knowledge

- `web-scraper-toolkit.ts`: web extraction
- `arxiv-toolkit.ts`: arXiv retrieval
- `api-integration-toolkit.ts`: generic API orchestration
- `rag-toolkit.ts`: retrieval-augmented utilities
- `knowledge-graph-toolkit.ts`: graph/entity utilities

### Engineering and diagnostics

- `code-analysis-toolkit.ts`: code quality checks
- `test-toolkit.ts`: test execution/inspection
- `git-toolkit.ts`: SCM operations
- `filesystem-toolkit.ts`: filesystem operations
- `debug-tool.ts`: diagnostics and context inspection
- `reasoning-tool.ts`: structured reasoning helpers

### Utility modules

- `semantic-utils.ts`: shared semantic helper utilities
- `weather-toolkit.ts`: weather-oriented tools used by assistant workflows

## Agent wiring guidance

- Data agents (`data-analyzer`, `data-scientist`): market + analysis + visualization + retrieval tools
- Coding/reviewer agents: code-analysis + tests + git + filesystem + debug
- Fact/synthesis agents: verification + graph + RAG + retrieval
- Coordinator/assistant agents: discovery + API + reasoning tools

## Quality rules when editing tools

- Validate all input via Zod
- Keep output schema explicit and stable
- Respect cancellation (`context?.isActive`)
- Use structured tool hooks (`onStart`, `onEnd`) with useful provider context
- For network tools: include timeout/retry options and actionable provider errors

## Change checklist

- [ ] export names match consuming agent imports
- [ ] no stale toolkit references remain after style changes
- [ ] docs updated when export pattern changes (toolkit ↔ single tools)
