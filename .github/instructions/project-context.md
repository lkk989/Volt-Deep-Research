---
applyTo: '**'
description: 'Comprehensive project context for Mastervolt Deep Research system'
---

# Project Context

**Mastervolt Deep Research** is a VoltAgent-based AI research system that orchestrates 7 specialized agents to conduct research and generate comprehensive reports. This is a production-grade multi-agent system demonstrating advanced orchestration patterns.

## Core Architecture

- **Project Name**: Mastervolt (v0.1.2)
- **Framework**: VoltAgent v1.1.37 (TypeScript multi-agent orchestration)
- **Runtime**: Node.js 18+ with ES2022 modules
- **Primary Workflow**: "research-assistant" - two-step research and writing pipeline
- **Entry Point**: src/index.ts with VoltAgent initialization and workflow registration

## Agent Ecosystem (7 Agents)

1. **assistantAgent**: Query generation, search coordination, weather tools, reasoning toolkit
2. **writerAgent**: Report synthesis, creates structured 2-paragraph reports with citations
3. **directorAgent**: Supervisor agent for managing sub-agents and experiments
4. **dataAnalyzerAgent**: Pattern analysis with `analyze_data_patterns`, `extract_key_insights` tools
5. **factCheckerAgent**: Verification with `verify_claim`, `cross_reference_sources`, `detect_bias` tools
6. **synthesizerAgent**: Information synthesis with `synthesize_information`, `resolve_contradictions`, `create_unified_narrative` tools
7. **scrapperAgent**: Web data extraction using webScraperToolkit (JSDOM/Cheerio/TurndownService)

## Technology Stack

- **AI Models**: Google Gemini (gemini-2.5-flash-lite-preview-09-2025 primary), OpenAI support, Vertex AI
- **Memory**: LibSQL per-agent databases (.voltagent/{agent-id}-memory.db) with semantic embeddings
- **Vector Store**: Shared LibSQL vector store (.voltagent/memory.db) with Google text-embedding-004
- **Server**: Hono web framework via @voltagent/server-hono with Swagger UI
- **Observability**: OpenTelemetry with LibSQL adapter, VoltOps integration (50% sampling)
- **A2A Communication**: Agent-to-agent via Supabase task store on port 3141

## Key Integrations

- **MCP Servers**: Exa Search (stdio), Hugging Face (HTTP), Filesystem access
- **VoltOps**: Automatic metrics forwarding with 512 batch size, 4s intervals
- **Supabase**: Alternative memory adapter with user profiles
- **External APIs**: Google AI, OpenAI, Vertex AI, Exa Search

## Development Standards

- **Files**: kebab-case (assistant.agent.ts, web-scraper-toolkit.ts)
- **Agent IDs**: lowercase-hyphen ("assistant", "data-analyzer")
- **Tool Names**: snake_case ("analyze_data", "scrape_website")
- **Imports**: .js extensions for ES modules, `import type` for types
- **Logging**: voltlogger from src/config/logger.js (Pino-based, trace level)
- **Error Handling**: Check `context?.isActive`, throw descriptive errors
- **Memory**: LibSQL with embedding cache enabled, 100 max history entries
