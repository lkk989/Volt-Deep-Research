# AGENTS.md - voltagent/workflows

Workflow definitions and orchestration pipelines.

## Available Workflows (Detailed)

Below are the workflows defined in `voltagent/workflows/` together with key metadata to make them easy to use and test.

- `comprehensive-research` (file: `comprehensive-research.workflow.ts`)
  - Internal ID: `comprehensive-research` (registered in `voltagent/index.ts` under the same key)
  - Purpose: Full sequential research pipeline (query generation → scraping → analysis → fact-check → synthesis → writing)
  - Input schema: { topic: string }
  - Result schema: { topic, queries, scrapedData, analysis, factCheck, synthesis, finalReport }
  - Steps & Agents: `generate-queries` (assistant) → `scrape-data` (scrapper) → `analyze-data` (data-analyzer) → `fact-check` (fact-checker) → `synthesize` (synthesizer) → `write-report` (writer) → `finalize`
  - Notes: Uses `.andTap()` for logging, Zod validation on input/result; final step consolidates outputs.

- `research-assistant` (file: `research-assistant.workflow.ts`)
  - Internal ID: `research-assistant` (NOTE: registered in `voltagent/index.ts` as `research-assistant-demo`)
  - Purpose: Lightweight helper to generate queries and produce a short written summary
  - Input schema: { topic: string }
  - Result schema: { text: string }
  - Steps & Agents: `research` (assistant) → `writing` (writer)
  - Notes: Simple two-step workflow useful for smoke tests and demos. Consider aligning registration key to the workflow's internal id for clarity.

- `comprehensive-research-director` (file: `ai-agent.workflow.ts`)
  - Internal ID: `comprehensive-research-director` (registered in `voltagent/index.ts` under same key)
  - Purpose: Director/PlanAgent-orchestrated pipeline. Uses `plan.agent` (deepAgent) to propose a high-level JSON plan then executes it.
  - Input schema: { topic: string }
  - Result schema: { finalReport: string, usedAgents: string[] }
  - Steps & Agents: `log-start` (andTap logging) → `propose-plan` (deepAgent/plan.agent) → `execute-plan` (executes agent sequence: assistant, scrapper, dataAnalyzer, factChecker, synthesizer, writer as proposed)
  - Notes: Robust plan parsing with JSON tolerance and schema validation; falls back to default pipeline if plan invalid.

- `data-pattern-analyzer` (file: `data-pattern-analyzer.workflow.ts`)
  - Internal ID: `data-pattern-analyzer` (registered with same key)
  - Purpose: Deterministic analysis of input text (patterns, metrics, findings)
  - Input schema: { text: string }
  - Result schema: { summary: string, metrics: { characters, words, lines, sentences }, findings: string[] }
  - Steps & Agents: `agent-analysis` (data-analyzer) → `finalize` (deterministic metrics + parsing agent output)
  - Notes: The finalization step computes deterministic metrics client-side to ensure reproducibility.

- `fact-check-synthesis` (file: `fact-check-synthesis.workflow.ts`)
  - Internal ID: `fact-check-synthesis` (registered with same key)
  - Purpose: Fact-check claims against sources and synthesize a coherent narrative with a risk assessment
  - Input schema: { topic: string, claims: string, sources: string }
  - Result schema: { topic, factCheckReport, synthesis, riskLevel }
  - Steps & Agents: `fact-check` (fact-checker) → `synthesize` (synthesizer) → `finalize` (extracts risk level)
  - Notes: Extracts risk level using robust text parsing with safe defaults.

- `sequential-research` (file: `sequential.workflow.ts`)
  - Internal ID: `sequential-research` (NOT currently registered in `voltagent/index.ts`)
  - Purpose: Example sequential chain (Query → Scrape → Analyze → Fact-check → Synthesize → Write)
  - Input schema: { topic: string }
  - Result schema: { topic: string, report: string }
  - Steps & Agents: queries (assistant) → scrape (scrapper) → analyze (data-analyzer) → factcheck (fact-checker) → synthesize (synthesizer) → write (writer)
  - Notes: Useful as a simpler alternative to `comprehensive-research`; consider registering if needed.

## Patterns and Recommendations

- Validation: Workflows use Zod for `input` and `result` schemas. Some workflows also include specialized suspend/resume schemas.
- Steps: Use `.andThen()` for sequential steps, `.andTap()` for logging side-effects, `.andAgent()` to run agents, and `.andWhen()`/`.andAll()`/`.andRace()` for conditional or parallel execution.
- Registration: Ensure the workflow's internal `id` and the key used in `voltagent/index.ts` are consistent (e.g., `research-assistant` vs `research-assistant-demo`).
- Testing: Add smoke tests that assert workflows are registered and that basic runs return results conforming to the declared result schema.
- Observability: Workflows automatically record execution traces; register them with `VoltAgent` to view traces in VoltOps.

References: See `workflows/overview.md` for the official workflow patterns and examples.

---

## Repository-sourced Workflow References (extracted from `workflows/*`)

Below are concise, repo-only summaries for each canonical workflows doc. Each entry includes the file path and the essential rules you need when creating or testing workflows in this project. Use these as the canonical quick-ref when authoring new workflows.

### workflows/overview.md

- Path: `workflows/overview.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Core workflow concepts: what a workflow is, builder vs runnable (`.toWorkflow()`), registering workflows with VoltAgent, and basic usage (`.run()` vs `.stream()`).
- Key points: register workflows to make them discoverable and enable REST endpoints; `.run()` is synchronous, `.stream()` returns an async event iterator for real-time monitoring.
- Actionable: Register workflows in `voltagent/index.ts` to enable REST and observability.

### workflows/hooks.md

- Path: `workflows/hooks.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Hook lifecycle: `onStart`, `onEnd`, `onStepStart`, `onStepEnd`.
- Key points: hooks are useful for logging/metrics/audit; keep them fast; do not mutate workflow state inside hooks; catch and handle errors.
- Actionable: Add `onStepStart`/`onStepEnd` to critical workflows for observability and latency metrics.

### workflows/execute-api.md

- Path: `workflows/execute-api.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Defines the `execute` function context: `data`, `state`, `getStepData`, `suspend`, `resumeData` and suspend/resume behavior.
- Key points: use `getStepData(stepId)` to access prior step inputs/outputs; use `suspend()` to pause and `resume()` to continue; return new objects (do not mutate `data`).
- Actionable: Use `inputSchema` and `result` schemas to validate inputs/outputs and guard suspend/resume data shapes.

### workflows/schemas.md

- Path: `workflows/schemas.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Explains Zod schemas for `input`, `result`, `suspendSchema`, `resumeSchema`, and step-level schemas.
- Key points: schemas provide type-safety and early validation; step-level schemas override workflow defaults; resume/suspend schemas prevent invalid resume data.
- Actionable: Always define `input` and `result` at minimum; add `resumeSchema` for any step that suspends.

### workflows/steps/and-then.md

- Path: `workflows/steps/and-then.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Core TypeScript function step. Use for arbitrary logic, API calls, streaming agent calls, and suspend/resume.
- Key points: available parameters: `{ data, state, getStepData, suspend, resumeData }`; return new objects; use `andThen` when you need tool support or streaming from agents.
- Actionable: Prefer `andThen` for steps that call agent methods which require tool usage or streaming.

### workflows/steps/and-agent.md

- Path: `workflows/steps/and-agent.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Structured AI step (`andAgent`) with typed `schema` for `generateObject` responses.
- Key points: `andAgent` enforces typed outputs; agents used in `andAgent` cannot use tools or streaming; use `andAgent` for deterministic, schema-driven model outputs.
- Actionable: Use `andAgent` for small, structured model calls (classification, extraction). Use `andThen` when tools/streaming are required.

### workflows/steps/and-when.md

- Path: `workflows/steps/and-when.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Conditional step execution (if condition true → run nested step).
- Key points: condition receives `data`/`state`; if false the step is skipped and original data is preserved.
- Actionable: Use `andWhen` to gate expensive or conditional processing (approvals, optional enrichment).

### workflows/steps/and-all.md

- Path: `workflows/steps/and-all.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Run multiple steps in parallel and wait for all to complete.
- Key points: all steps receive the same input, results are merged, failures in any step cause the entire `andAll` to fail.
- Actionable: Use for independent parallelizable tasks; handle errors in individual steps when partial success is acceptable.

### workflows/steps/and-race.md

- Path: `workflows/steps/and-race.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Run steps in parallel and take the first successful result.
- Key points: useful for cache vs DB vs API fallbacks; other steps are stopped once one wins.
- Actionable: Use to implement low-latency fallbacks (cache-first patterns).

### workflows/steps/and-tap.md

- Path: `workflows/steps/and-tap.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Read-only side effects (logging, analytics) that do not modify the workflow data.
- Key points: the return value is ignored; errors are caught and do not stop workflow execution.
- Actionable: Use `andTap` extensively for telemetry and non-critical side-effects.

11) workflows/streaming.md

- Path: `workflows/streaming.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Workflow streaming, writer API (`writer.write()`, `writer.pipeFrom()`), and programmatic vs REST streaming differences.
- Key points: programmatic `.stream()` preserves a continuous async iterator across suspend/resume; REST streaming will close on suspend and requires a resume call to get final result.
- Actionable: For live UIs prefer programmatic streaming (`workflow.stream()`); use `writer.pipeFrom()` to forward agent fullStream events to workflow stream.

1)  workflows/suspend-resume.md

- Path: `workflows/suspend-resume.md` (source: mcp_voltagent_get_voltagent_doc)
- Purpose: Human-in-the-loop patterns, suspend/resume semantics, cancel, and external suspend controllers.
- Key points: `suspend()` saves state and stops execution; `execution.resume()` continues; provide `resumeSchema` for typed resume data. External suspend controllers allow UI-driven pause/resume/cancel.
- Actionable: Add `resumeSchema` and use external suspend controllers for any workflow exposed to humans/approvers.

---

Sources & Tooling

- These summaries were generated by extracting the official VoltAgent workflow docs accessible via the VoltAgent MCP docs server using `mcp_voltagent_get_voltagent_doc` and `mcp_voltagent_list_voltagent_docs`.

- Each entry above includes the exact source file path inside the VoltAgent docs and is intended as an in-repo quick reference for writing new workflows.

Next actions (pick one):

- Add a small smoke test that asserts registered workflows exist in `voltAgent` (and optionally validate `result` schemas).

- Add a CI check that ensures AGENTS.md entries match actual workflow files and registration keys in `voltagent/index.ts` (detect `research-assistant` vs `research-assistant-demo` mismatch).

- Revert to a minimal summary if you prefer less detail.
