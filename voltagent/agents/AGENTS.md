# AGENTS.md - voltagent/agents

This file documents all agents defined in `voltagent/agents` and their roles.

## Overview

The `agents` directory contains specialized VoltAgent agents.

## Agents

### Main Orchestrator (PlanAgent)

- **plan.agent.ts** (export: `deepAgent`, registry id: `deep-research-agent`)
  - Role: Primary orchestrator for complex, multi-step research workflows. Responsible for planning (write_todos), delegation (task tool), filesystem management, summarization, and eviction of large tool outputs.
  - Key in-repo settings to be aware of: `maxSteps: 100`, `summarization.enabled: true`, `toolResultEviction.enabled: true`, `filesystem.virtualMode: true` (NodeFilesystemBackend).
  - Implementation note: Treat this agent as the authoritative conductor — tests and CI should validate its registration, plan parsing/fallback, and summarization/eviction behavior.

### Subagents (Specialized helpers)

These are intended to be called or delegated to by the PlanAgent for focused tasks.

- **assistant.agent.ts** (id: `assistant`): Query generation, quick research, and coordination of small tasks.
- **scrapper.agent.ts** (id: `scrapper`): Web scraping and content extraction (uses web-scraper-toolkit).
- **data-analyzer.agent.ts** (id: `data-analyzer`): Pattern detection, metrics, and structured analysis.
- **fact-checker.agent.ts** (id: `fact-checker`): Claim verification, cross-referencing, and bias detection.
- **synthesizer.agent.ts** (id: `synthesizer`): Combining streams into unified narratives and resolving contradictions.
- **writer.agent.ts** (id: `writer`): Long-form report composition and formatting (markdown-enabled).

Additional supportive agents (use when appropriate):

- **coding.agent.ts** (id: `coding-agent`): Implementation and code assistance tasks.
- **code-reviewer.agent.ts** (id: `code-reviewer`): Automated code review and quality checks.
- **data-scientist.agent.ts** (id: `data-scientist`): Advanced statistical modeling and EDA.
- **content-curator.agent.ts** (id: `content-curator`): Curates and ranks source content.
- **judge.agent.ts** (id: `satisfaction-judge`) and **support-agent** (id: `support-agent`): Evaluation and lightweight support flows.



### Utilities & Integrations

- **copilot.ts**: Integration with Copilot features and helper utilities.
- **agentHooks.ts**: Shared lifecycle hooks applied to agents (observability, security, audit, etc.).
- **prompts.ts**: Centralized shared prompt templates and guardrails.

## Usage Notes

- New agents must follow the patterns from `assistant.agent.ts` and register with the VoltAgent registry in `voltagent/index.ts`.
- Each agent should define a `id`, `name`, `purpose`, `model`, and `instructions` and configure memory (LibSQL) where appropriate.
- Use LibSQL memory files in `.voltagent/` (e.g., `.voltagent/assistant-memory.db`).
- Ensure agent hooks (security, audit) and `context?.isActive` checks are present as required by project rules.

---
