# AGENTS.md - src/agents

This file documents all agents defined in `src/agents` and their roles in the Mastervolt Deep Research system.

## Overview

The `agents` directory contains specialized VoltAgent agents that collaborate in a multi-agent workflow.

All agents:

- Use Google Gemini models by default.
- Use LibSQL-backed memory (per-agent + shared vector store).
- Follow strict TypeScript + Zod validation patterns.
- Log via `voltlogger` and integrate with observability where configured.

## Agents

### assistant.agent.ts (`assistantAgent`)

- id: `assistant`
- Role: Generates effective search queries, interprets user intents, and coordinates initial research tasks.
- Key:
  - Uses reasoning toolkit.
  - Example `get_weather` tool for demonstration.

### writer.agent.ts (`writerAgent`)

- id: `writer`
- Role: Produces long-form, high-quality research reports in markdown based on curated inputs.
- Key:
  - Strong style/quality constraints; no conversational filler.
  - Uses dedicated LibSQL memory for writing context.

### director.agent.ts (`directorAgent`)

- id: `director`
- Role: Supervisor/orchestrator for the full research workflow.
- Key:
  - Manages sub-agents: Assistant, Writer, Data Analyzer, Fact Checker, Synthesizer, Scrapper.
  - Applies custom guidelines for routing tasks between agents.

### data-analyzer.agent.ts (`dataAnalyzerAgent`)

- id: `data-analyzer`
- Role: Analyzes datasets and textual inputs for patterns, trends, correlations, and anomalies.
- Key tools:
  - `analyze_data_patterns`
  - `extract_key_insights`

### fact-checker.agent.ts (`factCheckerAgent`)

- id: `fact-checker`
- Role: Verifies claims, cross-references sources, and detects bias.
- Key tools:
  - `verify_claim`
  - `cross_reference_sources`
  - `detect_bias`

### synthesizer.agent.ts (`synthesizerAgent`)

- id: `synthesizer`
- Role: Synthesizes multi-source information, resolves contradictions, and creates unified narratives.
- Key tools:
  - `synthesize_information`
  - `resolve_contradictions`
  - `create_unified_narrative`

### scrapper.agent.ts (`scrapperAgent`)

- id: `scrapper`
- Role: Dedicated web data acquisition agent using the web scraper toolkit.
- Key:
  - Responsible for ethical, structured scraping; feeds other agents.

## Usage Notes

- New agents in this folder must:
  - Follow the patterns from `assistant.agent.ts` and `director.agent.ts`.
  - Use LibSQL memory with `.voltagent/{agent-id}-memory.db`.
  - Use Zod for working memory schemas.
  - Register with orchestration (e.g., via `directorAgent` or workflows) explicitly.
