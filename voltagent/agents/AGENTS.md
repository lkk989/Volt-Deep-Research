# AGENTS.md - src/agents

This file documents all agents defined in `src/agents` and their roles.

## Overview

The `agents` directory contains specialized VoltAgent agents.

## Agents

### Core Research Agents

- **assistant.agent.ts**: Generates search queries, coordinates initial research.
- **writer.agent.ts**: Produces long-form research reports.
- **director.agent.ts**: Supervisor/orchestrator for the full workflow.
- **data-analyzer.agent.ts**: Analyzes datasets and text for patterns.
- **fact-checker.agent.ts**: Verifies claims and detects bias.
- **synthesizer.agent.ts**: Synthesizes multi-source information.
- **scrapper.agent.ts**: Web data acquisition.

### Specialized Agents

- **coding.agent.ts**: Coding assistance.
- **code-reviewer.agent.ts**: Code review.
- **judge.agent.ts**: Evaluation/judging.
- **research-coordinator.agent.ts**: Orchestration and planning.
- **plan.agent.ts**: Deep research planning.
- **content-curator.agent.ts**: Content curation.
- **data-scientist.agent.ts**: Deep analysis and modeling.

### Utilities

- **copilot.ts**: Integration with Copilot features.
- **agentHooks.ts**: Lifecycle hooks for agents.
- **prompts.ts**: Shared prompt templates.

## Usage Notes

- New agents must follow the patterns from `assistant.agent.ts`.
- Use LibSQL memory with `.voltagent/{agent-id}-memory.db`.
- Register with orchestration explicitly.
