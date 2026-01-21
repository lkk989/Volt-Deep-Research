# AGENTS.md

Agent-specific instructions for the `src/` directory (mapped to `voltagent/` in this repo).

## Directory Purpose

The `voltagent/` directory contains the core backend logic and agent definitions for Mastervolt Deep Research:

- **agents/** - Multi-agent orchestration system
- **config/** - Centralized configuration
- **tools/** - Custom AI tools and toolkits
- **a2a/** - Agent-to-Agent communication
- **retriever/** - Vector DB retriever integrations
- **workflows/** - Workflow chain definitions
- **experiments/** - Eval/experiment configs

## Key Patterns by Directory

### src/agents/ - Agent Development

1. **Files**:
    - `assistant.agent.ts` - Query generation
    - `writer.agent.ts` - Report synthesis
    - `director.agent.ts` - Supervisor
    - `data-analyzer.agent.ts` - Data analysis
    - `fact-checker.agent.ts` - Verification
    - `synthesizer.agent.ts` - Synthesis
    - `scrapper.agent.ts` - Web scraping
    - `coding.agent.ts` - Coding assistance
    - `code-reviewer.agent.ts` - Code review
    - `judge.agent.ts` - Evaluation
    - `research-coordinator.agent.ts` - Coordination
    - `plan.agent.ts` - Planning
    - `copilot.ts` - Copilot integration
    - `agentHooks.ts` - Agent lifecycle hooks
    - `prompts.ts` - Shared prompts

### src/tools/ - Tool Development

1. **Files**:
    - `reasoning-tool.ts` - Reasoning toolkits
    - `debug-tool.ts` - Debugging
    - `web-scraper-toolkit.ts` - Web scraping
    - `filesystem-toolkit.ts` - File access
    - `data-processing-toolkit.ts` - Data processing
    - `knowledge-graph-toolkit.ts` - Graph tools
    - `api-integration-toolkit.ts` - API integration
    - `code-analysis-toolkit.ts` - Code analysis
    - `rag-toolkit.ts` - RAG
    - `test-toolkit.ts` - Testing
    - `git-toolkit.ts` - Git operations
    - `weather-toolkit.ts` - Weather data
    - `visualization-toolkit.ts` - Data viz
    - `alpha-vantage-toolkit.ts` - Financial data
    - `arxiv-toolkit.ts` - Academic paper search
    - `data-conversion-toolkit.ts` - Format conversion
    - `semantic-utils.ts` - Semantic helpers

## Import Rules

1. **Always use .js extension for local ES module imports**.
2. **Import types using `import type`**.
3. **Group imports**: External libraries first, then internal.

## Memory File Locations

All agents store memory in `.voltagent/` directory.
Ensure agents use the pattern: `url: "file:./.voltagent/{agent-id}-memory.db"`

## Logging Patterns

Always use `voltlogger` from config.
