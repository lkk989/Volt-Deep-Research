# Agents Hook & Lifecycle Sync Plan

Goal: Bring all agents, tools, and workflows in ./voltagent to a production-grade lifecycle configuration. This includes: per-agent hook presets (observability, security, audit, supervisor), consistent operation context usage, guardrails, citation and output policies (already applied to prompts), tool tags and needsApproval policies, and tests/acceptance criteria.

Status: Draft plan — apply changes after review.

---

## Executive summary

We will adopt named hook presets (verbose, minimal, security, supervisor, audit) from voltagent/agents/agentHooks.ts and map them to agents based on their responsibilities. For each agent we will:
- Assign a hook preset
- Add or verify summarization/config where appropriate (PlanAgent, long-running agents)
- Ensure tools used by agent have tags and `needsApproval` where applicable
- Add/verify guardrails and input/output validation
- Add unit/integration tests for lifecycle behavior (hook calls, bail() paths, error handling)

Acceptance: Each agent should pass automated tests that verify onStart/onToolStart/onToolEnd/onEnd/onError/onHandoff behavior and should have a documented preset in memory-bank.

---

## Agent mapping & actions

- assistant
  - Preset: minimal
  - Why: High-throughput query generator; only lightweight tracing + opId required
  - Tasks:
    - Keep inline minimal hooks (opId creation) or switch to agentHookPresets.minimal
    - Add unit test: verifies opId exists in context after start
    - Verify `assistantPrompt` includes outputFormat and forbids fabricated sources

- writer
  - Preset: audit
  - Why: Produces finalizable reports; we want tool/result auditing, citations
  - Tasks:
    - Use agentHookPresets.audit (capture tool inputs/outputs)
    - Ensure prompts require citationStyle & References section (done)
    - Add I/O tests that validate final report contains a References block when mustCite=true

- deep-work-agent (PlanAgent)
  - Preset: supervisor + audit
  - Why: Orchestrates subagents and manages bail logic; needs audit trail for decisioning
  - Tasks:
    - Ensure supervisorAgentHooks.onHandoffComplete properly calls bail() for large final outputs
    - Add integration test for `task` tool delegation + bail path
    - Enable summarization and toolResultEviction settings verification

- director (Director agent)
  - Preset: supervisor
  - Why: Coordinates high-level research flows but should not perform heavy logging itself
  - Tasks:
    - Keep supervisorAgentHooks and add a clear systemMessage to delegate to PlanAgent
    - Add workflow tests to ensure director delegates the plan generation to PlanAgent

- fact-checker
  - Preset: security + audit
  - Why: Handles sensitive verification tasks; must redact secrets and keep audit logs
  - Tasks:
    - Switch to combined preset (security for input redaction + audit for tool logs) or merge both for this agent
    - Add tests for verify_claim tool behavior, including edge-case claims and error paths

- data-analyzer / data-scientist
  - Preset: audit
  - Why: Tool-heavy analysis; require structured logs and reproducibility
  - Tasks:
    - Ensure tools produce structured outputs and are logged via audit hooks
    - Add tests validating numeric outputs and that large outputs are evicted to filesystem when configured

- scrapper
  - Preset: security
  - Why: Web scraping can harvest PII; must do redactions and include metadata in outputs
  - Tasks:
    - Use securityAgentHooks
    - Verify scrapperPrompt includes returnMetadata and that scraper tools attach (url, status, selector, excerpt)
    - Add tests simulating PII detection and blocking

- synthesizer
  - Preset: verbose or audit (team preference)
  - Tasks:
    - Ensure it includes conflict resolution steps in prompts
    - Add tests for integration with fact-checker outputs

- codingAgent / codeReviewer
  - Preset: audit
  - Why: Tool-based, needs code outputs and test validations; audit logs help debugging
  - Tasks:
    - Tag tools (e.g., "destructive" for anything that writes or runs code) and use needsApproval where appropriate
    - Add tests for onToolStart/onToolEnd logs and tool denial cases

- judge / support / researchCoordinator / contentCurator / copilot
  - Preset: minimal (unless specified otherwise)
  - Tasks:
    - Validate minimal hooks create opId and log start/end
    - Add smoke tests that ensure hooks run and don't throw

---

## Tool & Workflow actions

- Tools
  - Ensure tool definitions have clear `description`, `parameters`, and `tags`.
  - Use `needsApproval` for destructive or sensitive tools (e.g., runCommand, processPayment, db-write). Add tests verifying ToolDeniedError flows.
  - Add providerOptions or cacheControl for heavy external APIs where supported.

- Workflows
  - Ensure workflows that rely on subagents set supervisorConfig.fullStreamEventForwarding appropriately depending on whether they need text-delta forwarded
  - Add workflow-level tests that simulate subagent failures and verify supervisorConfig.throwOnStreamError behavior

---

## Testing & Automation

- Unit tests for each hook preset verifying expected side effects (opId creation, messages redaction, audit logs, bail behavior).
- Integration tests for supervisor flow (delegate_task, onHandoffComplete bail()) and end-to-end workflows (comprehensive-research flow using PlanAgent).
- CI job: add 'voltagent:agent-lifecycle' test suite that runs these checks.

---

## Acceptance criteria

- Each agent has an assigned preset and passing tests for lifecycle events.
- Tools have tags and needsApproval where required; tests verify denial flows.
- Workflows handle subagent events with supervisorConfig settings; tests cover streaming & error handling.
- Memory-bank updated with the mapping and tests added in the repo.

---

## Next steps (pick one)
1. Apply the mapping automatically across agents (I will create a PR making the changes and tests).  
2. Create the test scaffolding and CI tests before applying changes.  
3. Walk through the mapping with you and adjust per-agent decisions.

Which next step should I take? (reply 1/2/3 or give adjustments to mapping)
