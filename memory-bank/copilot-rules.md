# Copilot Rules

## 🚨 Security: Never Upload Secrets

- Never commit API keys, `.env`, or credentials to the repository
- Use `.env.example` with safe placeholder values only
- If a secret is leaked: rotate credentials immediately, purge git history, notify team
- Always verify no secrets are staged before committing

## 🧠 Project-Specific Rules

### Agent Development (VoltAgent v2)

- Use `@voltagent/core` v2 patterns for new agents
- Each agent must have: `id`, `name`, `purpose`, `model`, `instructions`
- Configure memory with LibSQL adapter and Zod schema for working memory
- Register agents in `voltagent/index.ts`
- Use `inputGuardrails` and `outputGuardrails` for security
- Configure `maxSteps` (100 for PlanAgent, 25 for others)
- Use `AiSdkEmbeddingAdapter` for embeddings

### Tool Development

- Use `createTool()` with Zod parameter validation
- Always check `context?.isActive` for cancellation support
- Log operations with `voltlogger` (trace, info, warn, error)
- Group related tools into toolkits (export as array)
- Use semantic naming: `tool_name` (lowercase with underscores)

### Workflow Development

- Use `createWorkflowChain()` with typed input/result schemas
- Access previous step data via `getStepData(stepId)`
- Register workflows in `voltagent/index.ts`

### Guardrails (IMPORTANT)

- Use built-in guardrails for security:
  - `createDefaultInputSafetyGuardrails()` - blocks harmful prompts
  - `createDefaultPIIGuardrails()` - redaction
  - `createDefaultSafetyGuardrails()` - profanity filter
  - `createSensitiveNumberGuardrail()` - mask credit cards, SSN
  - `createMaxLengthGuardrail()` - limit output

### Code Style

- Use named exports (no default exports)
- Use `.js` extension for internal imports (ESM)
- Use `import type` for type-only imports
- Follow kebab-case for files, camelCase for variables
- Use `.ts` for TypeScript, `.tsx` for React components

## 🧪 Testing & Safety

- Write tests for all new tools and agents
- Use Vitest with jsdom environment
- Target 95% coverage for critical paths
- Run `npm test` before committing

## 📁 File Organization

```bash
voltagent/agents/       → Agent definitions (14+ agents)
voltagent/tools/        → Tools and toolkits (28+ toolkits)
voltagent/workflows/    → Workflow chains
voltagent/config/       → Configuration modules
voltagent/a2a/          → Agent-to-agent communication
app/                   → Next.js 16 App Router
memory-bank/           → AI context documentation
```

## 🔄 Memory Bank Usage

- Read all memory bank files at session start
- Update `activeContext.md` when focus changes
- Update `progress.md` after completing features
- Add new patterns to this file as discovered
- Sync with README.md after major changes

## 🛠️ Available Toolkits (Reference)

- web-scraper-toolkit, arxiv-toolkit, stock-market-toolkit
- crypto-market-toolkit, alpha-vantage-toolkit
- financial-analysis-toolkit, statistical-analysis-toolkit
- pdf-toolkit, github-toolkit, rag-toolkit
- knowledge-graph-toolkit, code-analysis-toolkit
- data-processing-toolkit, visualization-toolkit

---

\*Last Updated: 2026-02-14
