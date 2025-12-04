# Tasks: Gap-improve (REVISED)

## Task Breakdown

Based on **verified** VoltAgent v1.1.30+ documentation and corrected gap analysis.

### Critical Fixes (Must Do First)

| ID | Title | Description | Acceptance Criteria | Effort | Dependencies |
|----|-------|-------------|---------------------|--------|--------------|
| **A2A-1** | Fix SupabaseTaskStore | Replace broken SupabaseMemoryAdapter with direct Supabase client | - Uses `createClient()` directly<br>- `load()` queries `a2a_tasks` table<br>- `save()` upserts correctly<br>- No `(as any)` casts | M | Supabase table created |
| **A2A-2** | Create Supabase table schema | Document/create `a2a_tasks` table | - Table exists in Supabase<br>- Schema matches design doc | XS | None |
| **A2A-3** | Clean A2A server.ts | Remove manual `agentRegistry` wrapper | - No `a2aServer.initialize({ agentRegistry: ... })`<br>- VoltAgent auto-registers agents | XS | A2A-1 |

### New Components

| ID | Title | Description | Acceptance Criteria | Effort | Dependencies |
|----|-------|-------------|---------------------|--------|--------------|
| **RET-1** | Create ResearchRetriever | Implement `BaseRetriever` for research context | - Extends `BaseRetriever`<br>- `retrieve()` returns formatted context<br>- Tracks sources in context<br>- Error handling with fallback | M | None |
| **RET-2** | Export retriever from index.ts | Create `src/retriever/index.ts` | - Exports `researchRetriever` singleton<br>- Type exports included | XS | RET-1 |
| **GRD-1** | Create guardrails module | Use VoltAgent built-in factories + custom | - `createDefaultInputSafetyGuardrails()`<br>- `createDefaultPIIGuardrails()`<br>- `createDefaultSafetyGuardrails()`<br>- Custom citation guardrail | S | None |
| **HOOK-1** | Create shared hooks factory | `createSharedHooks(agentName)` function | - All 8 hook types<br>- Includes `onError`<br>- Includes `onPrepareModelMessages`<br>- Consistent logging | M | None |

### Agent Integration

| ID | Title | Description | Acceptance Criteria | Effort | Dependencies |
|----|-------|-------------|---------------------|--------|--------------|
| **INT-1** | Integrate assistant.agent.ts | Add retriever, guardrails, hooks | - `retriever: researchRetriever`<br>- `inputGuardrails`<br>- `outputGuardrails`<br>- `hooks: createSharedHooks("assistant")` | S | RET-1, GRD-1, HOOK-1 |
| **INT-2** | Integrate data-analyzer.agent.ts | Add retriever, guardrails, hooks | Same as INT-1 | S | RET-1, GRD-1, HOOK-1 |
| **INT-3** | Integrate fact-checker.agent.ts | Add retriever, guardrails, hooks | Same as INT-1 | S | RET-1, GRD-1, HOOK-1 |
| **INT-4** | Integrate synthesizer.agent.ts | Add retriever, guardrails, hooks | Same as INT-1 | S | RET-1, GRD-1, HOOK-1 |
| **INT-5** | Integrate writer.agent.ts | Add guardrails, hooks (no retriever) | - `inputGuardrails`<br>- `outputGuardrails`<br>- `hooks: createSharedHooks("writer")` | S | GRD-1, HOOK-1 |
| **INT-6** | Integrate scrapper.agent.ts | Add guardrails, hooks (no retriever) | Same as INT-5 | S | GRD-1, HOOK-1 |
| **INT-7** | Integrate director.agent.ts | Add guardrails, hooks (no retriever) | Same as INT-5 | S | GRD-1, HOOK-1 |

### Testing & Documentation

| ID | Title | Description | Acceptance Criteria | Effort | Dependencies |
|----|-------|-------------|---------------------|--------|--------------|
| **TEST-1** | Unit tests for TaskStore | Test load/save with mocked Supabase | - CRUD operations tested<br>- Error cases covered | S | A2A-1 |
| **TEST-2** | Unit tests for Retriever | Test retrieve method | - Text extraction tested<br>- Formatting tested<br>- Error fallback tested | S | RET-1 |
| **TEST-3** | Unit tests for Guardrails | Test built-in + custom | - PII patterns verified<br>- Citation format validated | S | GRD-1 |
| **TEST-4** | Integration test | E2E agent with all components | - Agent responds correctly<br>- Guardrails execute<br>- Hooks log properly | M | All INT-* |
| **DOC-1** | Update AGENTS.md | Document new components | - Retriever documented<br>- Guardrails documented<br>- Hooks documented | XS | All |
| **DOC-2** | Update memory bank | Refresh context, progress | - context.md updated<br>- progress.md updated | XS | All |

## Implementation Order

```mermaid
graph TD
    A2A2[A2A-2: Create Supabase table] --> A2A1[A2A-1: Fix TaskStore]
    A2A1 --> A2A3[A2A-3: Clean server.ts]
    
    RET1[RET-1: ResearchRetriever] --> RET2[RET-2: Export index]
    GRD1[GRD-1: Guardrails module]
    HOOK1[HOOK-1: Shared hooks factory]
    
    RET2 --> INT1[INT-1: assistant]
    GRD1 --> INT1
    HOOK1 --> INT1
    
    INT1 --> INT2[INT-2: data-analyzer]
    INT2 --> INT3[INT-3: fact-checker]
    INT3 --> INT4[INT-4: synthesizer]
    INT4 --> INT5[INT-5: writer]
    INT5 --> INT6[INT-6: scrapper]
    INT6 --> INT7[INT-7: director]
    
    A2A3 --> TEST1[TEST-1: TaskStore tests]
    RET2 --> TEST2[TEST-2: Retriever tests]
    GRD1 --> TEST3[TEST-3: Guardrails tests]
    
    INT7 --> TEST4[TEST-4: Integration test]
    TEST4 --> DOC1[DOC-1: AGENTS.md]
    TEST4 --> DOC2[DOC-2: Memory bank]
```

## Effort Summary

| Category | Tasks | Total Effort |
|----------|-------|--------------|
| Critical Fixes | A2A-1, A2A-2, A2A-3 | M + 2×XS = ~1d |
| New Components | RET-1, RET-2, GRD-1, HOOK-1 | 2×M + S + XS = ~1.5d |
| Agent Integration | INT-1 through INT-7 | 7×S = ~1d |
| Testing | TEST-1 through TEST-4 | 3×S + M = ~1d |
| Documentation | DOC-1, DOC-2 | 2×XS = ~0.5d |

**Total Estimate:** 4-5 days

## Key Changes from Original Tasks

### Removed (Not Needed)

- ~~New agents (KnowledgeGraph, SourceValidator, CitationManager)~~ - Focus on fixing core issues first
- ~~Custom guardrail implementations~~ - Use VoltAgent built-in factories
- ~~filterAgents configuration~~ - Optional, not critical

### Changed

- A2A TaskStore: Complete rewrite, not just interface fix
- Guardrails: Use built-in factories instead of custom implementations
- Retriever: Simplified, single class instead of multiple

### Added

- Supabase table schema creation
- Integration tasks for each agent
- More comprehensive testing

---

**Status:** REVISED - READY FOR APPROVAL  
**Next:** `/approve tasks` → Code Generation  
**Critical Path:** A2A fixes → Components → Integration → Testing
