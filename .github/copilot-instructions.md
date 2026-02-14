---
name: Mastervolt Deep Research Copilot Instructions
applyTo: '**'
---

# 🤖 Mastervolt Deep Research - Copilot Instructions

## 🚀 Quick Start

- 🧠 Read `/memory-bank/memory-bank-instructions.md` first
- 🗂 Load ALL `/memory-bank/*.md` files before ANY task
- ✅ Confirm with `[Memory Bank: Active]` or warn with `[Memory Bank: Missing]`
- ✅ Update Memory Bank with new patterns, decisions, and progress after tasks
- 🔄 Refresh `activeContext.md` and `progress.md` before starting new tasks
- 📌 Always update `activeContext.md` and `progress.md` after tasks
- 🔍 Use memory bank for research, patterns, and context before coding.
- 📚 Refer to `systemPatterns.md` for architectural patterns and `producttext.md` for product vision.
- 🛠 For new features, create spec in `memory-bank/` before coding.
- 🔒 Never commit sensitive info (API keys, credentials, `.env`)
- 🧪 Write tests for all new tools and agents (Vitest + jsdom)
- 📊 Target 95% coverage for critical paths

## 🔄 Workflow

- 🚦 Use Kiro-Lite workflow: **PRD → Design → Tasks → Code**
- 📝 On "/update memory bank", refresh `activeContext.md` & `progress.md`
- 🏗️ For new features, create spec first in `memory-bank/`

## 🔒 Security & Code Quality

- 🔐 Never commit API keys, `.env`, or credentials
- ✅ Run `npm run lint` and `npm test` before committing
- 🧪 Write tests for all new tools and agents (Vitest + jsdom)
- 📊 Target 95% coverage for critical paths

## 🛠️ Development Tools

### Research & Learning

- 🔍 For research, use `websearch` or `tavily` tools
- 📚 Use VoltAgent docs: `voltagent_search_voltagent_docs`, `voltagent_get_voltagent_doc`
- 🧪 Use Mastra docs: `mastraBeta_mastraDocs`, `mastraBeta_mastraExamples`

### Code Quality

- 🤖 Check code for errors before writing new code
- ✨ Run `npm run prettier` for formatting
- 🔧 Use linter: `npm run lint`

## 📁 Project Structure

```bash
voltagent/               # Multi-agent backend
├── agents/             # 14+ specialized agents
├── tools/              # 28+ toolkits
└── config/             # Configuration modules

app/                    # Next.js 16 frontend
├── dashboard/          # Protected routes
    ├─── _components/     # Dashboard-specific components including AI-enabled ones
    ├─── chat/            # Chat interface page
    ├
    ├─── page.tsx          # Dashboard page
    ├─── layout.tsx        # Dashboard layout
    
└── api/                # API routes

lib/
├── Shared utilities and helpers

hooks/
├── Custom React hooks

components/ui/
├── Reusable UI components
components/ai-enabled/
├── AI-powered components (e.g. SearchBar, ReportViewer)

memory-bank/            # AI context memory
├── activeContext.md    # Current focus
├── progress.md         # Build status
└── *.md               # Context files
```

## 🎯 TypeScript Standards

- ✅ Use strict TypeScript (enabled in tsconfig.json)
- 📝 Use `import type` for types only
- 🏷️ Use `interface` for object shapes, `type` for unions
- 🚫 Never use `any`, use `unknown` instead
- 📦 Use named exports (no defaults)

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test -- --coverage # With coverage
npx vitest run -t "pattern" # Specific tests
```

## 🔧 Available Commands

```bash
npm run dev          # VoltAgent dev server (watch mode)
npm run dev:next     # Next.js dev server
npm run dev:test     # Run both concurrently
npm run build:volt   # TypeScript compilation
npm run build:next   # Next.js build
npm start            # Production server
npm run lint         # ESLint
npm run prettier     # Format code
```

## MCP Tools
- use your interface to call MCP tools, e.g. `websearch`, `tavily`, `voltagent_search_voltagent_docs`, `voltagent_get_voltagent_doc`, `mastraBeta_mastraDocs`, `mastraBeta_mastraExamples`, `i

## 📋 Agent & Tool Development

### Creating Agents

- Use `@voltagent/core` patterns
- Required: `id`, `name`, `purpose`, `model`, `instructions`
- Configure memory with LibSQL adapter + Zod schema

### Creating Tools

- Use `createTool()` with Zod parameter validation
- Check `context?.isActive` for cancellation
- Log with `voltlogger` (trace, info, warn, error)
- Group into toolkits (export as array)

### Creating Guardrails

- Use `createInputGuardrail()` and `createOutputGuardrail()`
- Located in `voltagent/config/guardrails.ts`
- Examples: topic validation, PII sanitization, output filtering

## 🔗 Key Resources

- [VoltAgent Docs](https://voltagent.dev/docs/)
- [VoltOps Platform](https://console.voltagent.dev)
- [GitHub](https://github.com/ssdeanx/Mastervolt-Deep-Research)

---

_Last Updated: 2026-02-14_
_For full context, see `/memory-bank/` files_
