# AGENTS.md - src/tools

Documentation for the tools folder in the VoltAgent project.

## Tool Categories

### Core Toolkits

- **debug-tool.ts**: Context inspection (`log_debug_info`).
- **reasoning-tool.ts**: Cognitive reasoning (`think`, `analyze`).
- **web-scraper-toolkit.ts**: Web scraping (`scrape_webpage`, `extract_content`).

### Data & Analysis

- **data-processing-toolkit.ts**: Data manipulation.
- **data-conversion-toolkit.ts**: Format conversion (CSV, JSON, XML).
- **visualization-toolkit.ts**: Data visualization helpers.
- **knowledge-graph-toolkit.ts**: Graph operations.
- **semantic-utils.ts**: Semantic analysis utilities.

### Integration & External APIs

- **api-integration-toolkit.ts**: Generic API helpers.
- **alpha-vantage-toolkit.ts**: Financial market data.
- **arxiv-toolkit.ts**: Academic paper search.
- **weather-toolkit.ts**: Weather data.

### Development & Ops

- **filesystem-toolkit.ts**: File access.
- **git-toolkit.ts**: Git operations.
- **test-toolkit.ts**: Testing helpers.
- **code-analysis-toolkit.ts**: Codebase analysis.
- **rag-toolkit.ts**: RAG operations.

## Development Workflow

### Creating a New Tool

Use `createTool` with Zod schema validation.

### Creating a New Toolkit

Use `createToolkit` to group related tools.

### Testing

Colocate tests with source files (e.g., `my-tool.test.ts`).
