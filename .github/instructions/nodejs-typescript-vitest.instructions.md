---
description: "Guidelines for writing Node.js and TypeScript code with Vitest testing in the Mastervolt Deep Research project"
applyTo: '**/*.ts, **/*.tsx'
---

# Code Generation Guidelines for Mastervolt Deep Research

## Project Overview
This project uses VoltAgent v1.1.35 for multi-agent orchestration, TypeScript 5.9.3, Node.js 18+, and Vitest 4.0.1 for testing. Follow these guidelines to ensure code aligns with the project's architecture, patterns, and technology standards.

## Coding Standards
- Use TypeScript 5.9.3 with ES2022 features and Node.js 18+ ESM modules
- Target ES2022 with strict mode enabled (all strict compiler options)
- Use Node.js built-in modules where possible; ask user before adding external dependencies
- Always use async/await for asynchronous code
- Keep code simple, maintainable, and self-explanatory
- Use descriptive variable and function names
- Do not add comments unless absolutely necessary (code should be self-documenting)
- Never use `null`; always use `undefined` for optional values
- Prefer functions over classes, except for VoltAgent-specific classes (Agent, Memory, etc.)
- Follow Prettier config: no semicolons, single quotes, 4-space tabs, trailing commas ES5 style
- Follow ESLint config: no unused vars (warn), object shorthand, prefer arrow callbacks, const by default, no var, strict equality, no shadow

## Error Checking and Linting
After any code edit, always invoke `get_errors` (editor API) and capture its output. Record a one-line summary of results in the edit note (e.g., "get_errors: 0 errors, 1 warning — fixed"). This is critical for linking with the project's internal linter.

Using `get_errors` provides immediate feedback on your edits, helping you:
- **Catch mistakes early**: Identify syntax errors, type mismatches, and linting violations before they cause runtime issues or build failures.
- **Track progress**: Monitor the reduction in errors and warnings as you fix issues, ensuring you're moving toward clean, compliant code.
- **Ensure quality**: Verify that changes align with the project's strict TypeScript mode, ESLint rules, and Prettier formatting, preventing regressions.
- **Edit confidently**: Know instantly if an edit introduces problems, allowing you to iterate quickly without accumulating technical debt.

Always run `get_errors` after substantive changes to maintain code integrity and avoid broken states.

## Automatic Ban or Termination Conditions
- If `get_errors` is not run after an edit, issue a warning. Repeated failures to run it will lead to termination

## Strict Editing Rules (Must-Follow)
1. Always implement unused imports, variables, and functions. Never remove them by default.
   - If a symbol is unused, implement its intended behavior or refactor code so it becomes used.
   - If you cannot determine correct behavior, add a precise TODO comment: `// TODO: <owner> - reason` and KEEP the symbol.
   - Do NOT delete symbols or imports without explicit approval.
2. Preserve existing code structure, style, and logic whenever possible.
3. Integrate new logic into existing patterns rather than replacing blocks.
4. Only modify code explicitly targeted by user requests.

## Naming & Typing Conventions (Enforce Across Edits)
- Variables & functions: camelCase (e.g., `getStepData`, `assistantAgent`).
- Classes, Agents, Constructors: PascalCase (e.g., `UserProfile`, `VoltAgentObservability`).
- Files: kebab-case (e.g., `assistant.agent.ts`, `reasoning-tool.ts`).
- Types & interfaces: PascalCase. Prefer plain `UserProfile` over `IUserProfile`.
- Generic type aliases: `TResponse` sparingly, only when helpful.
- Agent IDs: lowercase with hyphens (e.g., `"assistant"`, `"writer"`).
- Tool names: lowercase with underscores (e.g., `"log_debug_info"`).
- Avoid single-letter names except for short-lived loop indices (i, j).
- Prefer explicit exported type annotations for public APIs.
- Imports: Use `import type` for types; use `.js` extensions for internal ES modules.

## VoltAgent Patterns
### Agent Creation
Follow the pattern in `src/agents/assistant.agent.ts`:
- Use `new Agent({ ... })` with explicit configuration.
- Initialize LibSQL memory with unique agent ID: `file:./.voltagent/{agent-id}-memory.db`.
- Use Google text-embedding-001 for embeddings.
- Include `logger: voltlogger`, `maxHistoryEntries: 100`, etc.

### Tool Creation
Use `createTool()` with Zod schema validation:
- Define parameters with `.describe()`.
- Check `context?.isActive` before execution.
- Log operations with `voltlogger`.
- Return string or structured object.

### Workflow Chaining
Use `createWorkflowChain()` with Zod schemas:
- Define input/result schemas.
- Chain with `.andThen()` for sequential execution.
- Access previous data with `getStepData("step-id")`.

### Logging
Use `voltlogger` from `./config/logger.js`:
- `voltlogger.info()`, `error()`, `trace()`, etc.
- Log significant operations and errors.

### Error Handling
- Throw descriptive errors for synchronous ops.
- Let async errors bubble up.
- Check `context?.isActive` for cancellation.
- Log errors before throwing.

## Testing
Always use `npx vitest run` for all testing commands.
- Use Vitest 4.0.1 for testing with jsdom environment.
- Write tests for all new features and bug fixes.
- Cover edge cases, error handling, and async operations.
- NEVER change original code to make testing easier; test as-is.
- Test files: colocated (`src/**/*.test.ts`) or centralized (`tests/**/*.test.ts`).
- Run all tests: `npx vitest run`
- Run with coverage: `npx vitest run --coverage`
- Run specific tests: `npx vitest run -t "test pattern"`

## Documentation
- Update README.md for significant changes or new features.
- When making changes to files in subdirectories (e.g., tools/), update the corresponding AGENTS.md file in that subdirectory to reflect the changes.
- When fetching URLs or external information, store the results in the docs/ folder (e.g., docs/urls/voltagent.md) for future reference.
- Code should be self-explanatory; avoid unnecessary comments.
- Use JSDoc for public APIs if needed.

## User Interactions
- Ask questions if unsure about implementation, design, or requirements.
- Always answer in the same language as the question, but use English for generated code, comments, or docs.

