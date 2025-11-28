---
name: Copilot Instructions
applyTo: '**'
---
- 🧠 Read `/memory-bank/memory-bank-instructions.md` first.
- 🗂 Load all `/memory-bank/*.md` before any task.
- 🚦 Use the Kiro-Lite workflow: PRD → Design → Tasks → Code.
- 🔒 Follow security & style rules in `copilot-rules.md`.
- 📝 On "/update memory bank", refresh activeContext.md & progress.md.
- ✅ Confirm memory bank loaded with `[Memory Bank: Active]` or warn with `[Memory Bank: Missing]`.

- 🔍 For research, use [#web] or [#websearch] tool and to make sure you have no knowledge gaps.
- 🤖 Check if there is a problem, use [#problem] tool to check code for errors.
  - This tool will help you identify issues and suggest fixes.
  - This is especially useful for debugging and improving code quality.
  - Try run it before writing new code & after completing so you can ensure everything works correctly.
- 📌 To update your memory bank, use [#update-memory-bank] tool to add new information.
- 🛠 Mastra mcp tools use [#mastradocs], [#mastraChanges], [#mastraexamples]  tool.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
