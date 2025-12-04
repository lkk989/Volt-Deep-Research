# PRD: Gap-improve

## Problem Statement

The Mastervolt Deep Research system has implementation gaps compared to VoltAgent v1.1.30+ best practices. After **thorough research** of VoltAgent documentation and examples, this PRD outlines the **accurate** gaps and solutions.

### ⚠️ Critical Discovery: Original Analysis Had Errors

The original gap analysis contained incorrect assumptions:

1. **A2A TaskStore**: `SupabaseMemoryAdapter` cannot be used for TaskStore - it's for agent Memory only
2. **A2A Registry**: No manual registry wrapper needed - VoltAgent auto-registers agents
3. **Retriever**: Agents need either `retriever` property OR tool-based retrieval, not both
4. **Guardrails**: VoltAgent provides built-in factory functions - don't reinvent

### Current State Analysis (CORRECTED)

| Component | Current Implementation | Actual Gap |
|-----------|----------------------|-----|
| **A2A TaskStore** | Uses `SupabaseMemoryAdapter` with `(as any)` casts | **BROKEN** - wrong adapter type, will fail at runtime |
| **A2A Server** | Manual `agentRegistry` wrapper | **UNNECESSARY** - remove wrapper, VoltAgent handles this |
| **Retriever** | `retriever: undefined` on all 7 agents | **MISSING** - no context retrieval for research |
| **Input Guardrails** | `inputGuardrails: []` on all agents | **MISSING** - no input validation |
| **Output Guardrails** | `outputGuardrails: []` on all agents | **MISSING** - no PII protection |
| **Hooks** | Missing `onError`, `onPrepareModelMessages` | **PARTIAL** - most hooks implemented |
| **New Agents** | 7 agents (good coverage) | **OPTIONAL** - evaluate need based on research quality |

## Goals

### Primary Goals (Critical)

1. **Fix A2A TaskStore** - Implement proper `TaskStore` interface using Supabase client directly
2. **Clean A2A Server** - Remove manual registry wrapper, use VoltAgent auto-registration
3. **Create Research Retriever** - Implement `BaseRetriever` for semantic context search
4. **Add Guardrails** - Use VoltAgent built-in factories + custom research-specific guardrails

### Secondary Goals (Medium Priority)

5. **Complete Hooks** - Add `onError`, `onPrepareModelMessages` for observability
6. **Integrate Retriever** - Add to research-focused agents (assistant, dataAnalyzer, factChecker, synthesizer)
7. **Integrate Guardrails** - Add to all 7 agents

### Optional Goals (Low Priority)

8. **New Specialized Agents** - Evaluate if Knowledge Graph, Source Validator, Citation Manager are needed
9. **filterAgents** - Add agent filtering if exposing subset to A2A

## Success Criteria

- [ ] A2A TaskStore persists tasks to Supabase without type errors
- [ ] A2A server.ts has no manual registry code
- [ ] `npm run dev` starts without runtime errors
- [ ] Retriever returns context from vector store on research queries
- [ ] Input guardrails block empty/malicious prompts
- [ ] Output guardrails redact PII (emails, phones, numbers)
- [ ] All agents have complete hooks including `onError`
- [ ] Test coverage >80% for new components

## Scope

### In Scope

| Area | Deliverables |
|------|-------------|
| **A2A** | Fix SupabaseTaskStore (use Supabase client), remove manual registry |
| **Retriever** | `ResearchRetriever` extending `BaseRetriever`, export from `src/retriever/` |
| **Guardrails** | Use `createDefaultInputSafetyGuardrails()`, `createDefaultPIIGuardrails()`, custom citation guardrail |
| **Hooks** | Shared hook factory with `onError`, `onPrepareModelMessages` |
| **Integration** | Apply retriever to 4 agents, guardrails to 7 agents |

### Out of Scope

- New agent creation (evaluate separately after core fixes)
- Voice integration
- Database migrations (Supabase table creation documented only)
- Dynamic agents (context-based model switching)
- MCP server additions
- UI/frontend changes

## Functional Requirements

### FR-1: A2A TaskStore (Critical Fix)

- FR-1.1: Replace `SupabaseMemoryAdapter` with direct Supabase client
- FR-1.2: Implement `load()` method querying `a2a_tasks` table
- FR-1.3: Implement `save()` method upserting to `a2a_tasks` table
- FR-1.4: Document required Supabase table schema

**Table Schema (to document):**

```sql
CREATE TABLE a2a_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB,
  UNIQUE(agent_id, task_id)
);
```

### FR-2: A2A Server Cleanup

- FR-2.1: Remove `a2aServer.initialize({ agentRegistry: ... })` call
- FR-2.2: VoltAgent auto-registers agents from `agents: { ... }` config
- FR-2.3: Optionally add `filterAgents` to exclude internal agents

### FR-3: Research Retriever

- FR-3.1: Create `ResearchRetriever` class extending `BaseRetriever`
- FR-3.2: Implement `retrieve()` method with LibSQL vector search
- FR-3.3: Return formatted context with source attribution
- FR-3.4: Track sources in `options.context` for reference

### FR-4: Guardrails (Use Built-in Factories)

- FR-4.1: Input: Use `createDefaultInputSafetyGuardrails()` (profanity, PII, injection, HTML)
- FR-4.2: Output: Use `createDefaultPIIGuardrails()` (numbers, emails, phones)
- FR-4.3: Output: Use `createDefaultSafetyGuardrails()` (profanity, max length)
- FR-4.4: Custom: Create citation format guardrail with `streamHandler`

### FR-5: Enhanced Hooks

- FR-5.1: Create `createSharedHooks(agentName)` factory function
- FR-5.2: Include `onError` hook with structured logging
- FR-5.3: Include `onPrepareModelMessages` for system message injection
- FR-5.4: Optionally include `onStepFinish` for step observability

### FR-6: Agent Integration

- FR-6.1: Add `retriever: new ResearchRetriever()` to: assistant, dataAnalyzer, factChecker, synthesizer
- FR-6.2: Add input/output guardrails to all 7 agents
- FR-6.3: Replace inline hooks with `createSharedHooks()` factory

## Non-Functional Requirements

- **NFR-1**: All code passes TypeScript strict mode
- **NFR-2**: Guardrails execute in <50ms per check
- **NFR-3**: Retriever returns results in <500ms
- **NFR-4**: No breaking changes to existing workflows
- **NFR-5**: Test coverage >80% for new components
- **NFR-6**: Backward compatible with existing agent configurations

## Technical Requirements

- TypeScript 5.9.3 strict mode
- VoltAgent @voltagent/core ^1.1.30
- @voltagent/a2a-server ^1.0.2
- @voltagent/libsql ^1.0.9
- @supabase/supabase-js ^2.86.0
- Zod ^4.1.13

## Dependencies

| Dependency | Required For | Notes |
|-----------|-------------|-------|
| Existing LibSQL vector store | Retriever | Already configured in memory |
| Supabase client | A2A TaskStore | Use existing config |
| @voltagent/core guardrails | All guardrails | Built-in factories |
| Existing agent memory pattern | New components | Follow established pattern |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| A2A TaskStore fix requires Supabase table | High | Document schema, provide migration |
| Built-in guardrails too strict | Medium | Start with defaults, tune thresholds |
| Retriever adds latency | Low | Use caching, async retrieval |
| Hook factory breaks existing behavior | Low | Keep backward compatible |

## Acceptance Criteria

1. Using commands=ban use `#problems` or `get_errors` to verify problems
2. A2A endpoints respond correctly
3. All success criteria checkboxes checked
4. All functional requirements implemented
5. Using commands=ban use `#problems` or `get_errors` to verify no linting or test errors
6. Documentation updated (AGENTS.md, context.md)

---

**Status**: AWAITING APPROVAL (REVISED)  
**Created**: 2025-11-27  
**Revised**: 2025-11-28  
**Phase**: PRD_INTAKE
