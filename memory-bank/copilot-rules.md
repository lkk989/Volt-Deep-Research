# Copilot Rules

## 🚨 Security: Never Upload Secrets

- Never commit API keys, `.env`, or credentials to the repository
- Use `.env.example` with safe placeholder values only
- If a secret is leaked: rotate credentials immediately, purge git history, notify team
- Always verify no secrets are staged before committing

## 🧠 Project-Specific Rules

### Agent Development

- Use `@voltagent/core` patterns for new agents
- Each agent must have: `id`, `name`, `purpose`, `model`, `instructions`
- Configure memory with LibSQL adapter and Zod schema for working memory
- Register agents in [src/index.ts](src/index.ts)

### Tool Development

- Use `createTool()` with Zod parameter validation
- Always check `context?.isActive` for cancellation support
- Log operations with `voltlogger` (trace, info, warn, error)
- Group related tools into toolkits (export as array)

### Workflow Development

- Use `createWorkflowChain()` with typed input/result schemas
- Access previous step data via `getStepData(stepId)`
- Register workflows in [src/index.ts](src/index.ts)

### Code Style

- Use named exports (no default exports)
- Use `.js` extension for internal imports (ESM)
- Use `import type` for type-only imports
- Follow kebab-case for files, camelCase for variables

## 🧪 Testing & Safety

- Write tests for all new tools and agents
- Use Vitest with jsdom environment
- Target 95% coverage for critical paths
- Run `npm test` before committing

## 📁 File Organization

```text
src/agents/       → Agent definitions
src/tools/        → Tools and toolkits
src/workflows/    → Workflow chains
src/config/       → Configuration modules
src/a2a/          → Agent-to-agent communication
```

## 🔄 Memory Bank Usage

- Read all memory bank files at session start
- Update `activeContext.md` when focus changes
- Update `progress.md` after completing features
- Add new patterns to this file as discovered

---

Last Updated: 2025-11-27
