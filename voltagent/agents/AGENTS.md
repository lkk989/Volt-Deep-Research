# AGENTS.md

Reference for `voltagent/agents/**`.

## Source of truth

If this file conflicts with implementation, code wins. Validate against:

1. `voltagent/index.ts` (top-level runtime `agents` registry)
2. `voltagent/agents/plan.agent.ts` (`deepAgent` subagents)
3. each `*.agent.ts` file (`id`, `purpose`, `tools`, `toolkits`)

## Runtime registration

### Top-level agents in `voltagent/index.ts`

- assistant
- support-agent
- satisfaction-judge
- research-coordinator
- writer
- director
- data-analyzer
- data-scientist
- fact-checker
- synthesizer
- scrapper
- coding-agent
- code-reviewer
- deep-research-agent

### Delegated by PlanAgent (`deepAgent`)

- assistant
- coding
- code-reviewer
- content-curator
- data-scientist
- research-coordinator
- director
- support
- judge
- writer
- data-analyzer
- fact-checker
- synthesizer
- scrapper

> `contentCuratorAgent` is delegatable but not currently top-level registered in `index.ts`.

## Agent catalog

### `deepAgent` (`plan.agent.ts`)

- **Type**: `PlanAgent`
- **Role**: primary orchestrator for complex tasks
- **Responsibilities**:
  - decompose work into todos
  - delegate to specialist subagents
  - review and iterate subagent outputs
  - synthesize final answer
  - manage long sessions (summarization + tool-result eviction)

### `assistantAgent` (`assistant.agent.ts`, id `assistant`)

- **Role**: query strategy and rapid discovery
- **Does**: produces high-signal research queries and investigation angles
- **Typical capabilities**: reasoning, arXiv, weather, workspace search/skills

### `researchCoordinatorAgent` (`research-coordinator.agent.ts`, id `research-coordinator`)

- **Role**: execution planner
- **Does**: builds dependency-aware plans and milestone tracking
- **Typical capabilities**: reasoning, API integration, RAG, debug, workspace search/skills

### `directorAgent` (`director.agent.ts`, id `director`)

- **Role**: quality governor
- **Does**: enforces orchestration quality gates and escalation logic
- **Typical capabilities**: reasoning + workspace search/skills

### `scrapperAgent` (`scrapper.agent.ts`, id `scrapper`)

- **Role**: source ingestion
- **Does**: extracts and normalizes web/API content with provenance metadata
- **Typical capabilities**: scraper, API integration, conversion, workspace search/skills

### `contentCuratorAgent` (`content-curator.agent.ts`, id `content-curator`)

- **Role**: evidence curation
- **Does**: scores, de-duplicates, and ranks source content for synthesis
- **Typical capabilities**: reasoning, knowledge graph, workspace search/skills

### `dataAnalyzerAgent` (`data-analyzer.agent.ts`, id `data-analyzer`)

- **Role**: analytical interpretation
- **Does**: extracts quantified patterns and decision-oriented findings
- **Typical capabilities**:
  - direct crypto + stock market tools
  - analysis/extraction helpers
  - financial + visualization + workspace retrieval

### `dataScientistAgent` (`data-scientist.agent.ts`, id `data-scientist`)

- **Role**: quantitative/statistical analysis
- **Does**: statistical workflows with explicit assumptions and uncertainty
- **Typical capabilities**:
  - direct crypto + stock market tools
  - data conversion/processing + visualization
  - reasoning + workspace retrieval

### `factCheckerAgent` (`fact-checker.agent.ts`, id `fact-checker`)

- **Role**: verification
- **Does**: verifies claims, detects bias, assigns confidence
- **Typical capabilities**: verify/cross-reference/bias tools + reasoning + workspace retrieval

### `synthesizerAgent` (`synthesizer.agent.ts`, id `synthesizer`)

- **Role**: integration
- **Does**: resolves contradictions and combines streams into coherent outputs
- **Typical capabilities**: synthesis + reasoning + knowledge graph + RAG + workspace retrieval

### `writerAgent` (`writer.agent.ts`, id `writer`)

- **Role**: report generation
- **Does**: produces citation-backed, decision-ready outputs
- **Typical capabilities**: workspace search/skills

### `codingAgent` (`coding.agent.ts`, id `coding-agent`)

- **Role**: implementation
- **Does**: implements/refactors code with architecture alignment
- **Typical capabilities**: debug, code analysis, filesystem, git, tests, workspace FS/search/sandbox/skills

### `codeReviewerAgent` (`code-reviewer.agent.ts`, id `code-reviewer`)

- **Role**: code audit
- **Does**: reviews correctness, security, performance, maintainability
- **Typical capabilities**: debug, code analysis, filesystem, git, tests, workspace FS/search/sandbox/skills

### `judgeAgent` (`judge.agent.ts`, id `satisfaction-judge`)

- **Role**: quality scoring
- **Does**: scores response quality and satisfaction signals
- **Typical capabilities**: workspace search/skills

### `supportAgent` (`judge.agent.ts`, id `support-agent`)

- **Role**: issue resolution
- **Does**: provides concise next-step support guidance
- **Typical capabilities**: workspace search/skills

## Prompt policy

- Use `prompts.ts` prompt builders rather than large inline instruction strings.
- Keep prompt tool descriptions aligned with actual agent imports.

## Change checklist

- [ ] Agent id/registration key is still valid in `index.ts`
- [ ] PlanAgent subagent graph updated when delegation changes
- [ ] `purpose` reflects current implemented behavior
- [ ] tool/toolkit assignments are role-appropriate
- [ ] prompt variables remain accurate
