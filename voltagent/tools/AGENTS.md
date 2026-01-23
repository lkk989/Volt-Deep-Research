# AGENTS.md - voltagent/tools

Documentation for the tools folder in the VoltAgent project.

## Tool Categories

### Core Toolkits

- **debug-tool.ts**: Context inspection and debug helpers (`log_debug_info`).
- **reasoning-tool.ts**: Cognitive reasoning (`think`, `analyze`).
- **web-scraper-toolkit.ts**: Web scraping (`scrape_webpage_markdown`, `extract_text_content`, `extract_structured_data`).

### Data & Analysis

- **data-processing-toolkit.ts**: Data manipulation and normalization.
- **data-conversion-toolkit.ts**: Format conversion utilities (CSV, JSON, XML).
- **visualization-toolkit.ts**: Data visualization helpers and converters.
- **knowledge-graph-toolkit.ts**: Graph creation and relationship mapping.
- **semantic-utils.ts**: Semantic analysis helpers, Python bridge, and utilities.

### Integration & External APIs

- **api-integration-toolkit.ts**: Generic API helpers and HTTP utilities.
- **alpha-vantage-toolkit.ts**: Financial market data helpers (Alpha Vantage).
- **arxiv-toolkit.ts**: Academic paper search and PDF extraction.
- **weather-toolkit.ts**: Weather data helpers and adapters.

### Development & Ops

- **filesystem-toolkit.ts**: File access and batch operations.
- **git-toolkit.ts**: Git operations (status, diff, log, commit).
- **test-toolkit.ts**: Testing helpers and test-run integration.
- **code-analysis-toolkit.ts**: TypeScript and codebase analysis (ts-morph based tooling).
- **rag-toolkit.ts**: RAG support and retrieval utilities.

### Other Tools

- **data-conversion-toolkit.ts**: CSV/JSON/XML format conversion helpers.
- **alpha-vantage-toolkit.ts**: (listed above) time-series utilities.
- **semantic-utils.ts**: Includes child_process usage for Python bridge — validate inputs.

## Development Notes

- All tools use `createTool` or `createToolkit` and Zod parameter schemas where applicable.
- Keep long-running external calls cancellable with `context?.isActive` checks.

## Development Workflow

### Creating a New Tool

Use `createTool` with Zod schema validation.

### Creating a New Toolkit

Use `createToolkit` to group related tools.

### Testing

Colocate tests with source files (e.g., `my-tool.test.ts`).
