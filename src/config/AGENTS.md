# AGENTS.md - src/config

Configuration patterns and service integrations for the Mastervolt system.

## Key Modules

- **logger.ts**: Pino-based `voltlogger`. Default level: `trace`. Import from `../config/logger.js`.
- **mcp.ts**: MCP server registry. Timeout: 60s.
- **supabase.ts**: Distributed state for A2A communication.
- **scorers.ts**: Custom Zod-validated scoring functions for evaluations.

## Rules

- **No Secrets**: Never hardcode API keys. Use `process.env`.
- **Extensions**: Always use `.js` in internal imports.
- **Logging**: Use the exported `voltlogger` instance only.
