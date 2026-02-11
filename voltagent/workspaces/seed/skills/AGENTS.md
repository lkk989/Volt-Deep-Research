# voltagent/workspaces/seed/skills/AGENTS.md

This directory contains example Workspace Skills that match the upstream skill layout.

Upstream reference:

- Skills layout + SKILL.md format: <https://voltagent.dev/docs/workspaces/skills/>

## Layout

Skills are directories containing a `SKILL.md` plus optional subdirectories:

- `references/`: docs the agent can read (only if allowlisted in SKILL.md)
- `scripts/`: runnable scripts (only if allowlisted)
- `assets/`: datasets/files (only if allowlisted)

These examples are copied into the workspace filesystem under `/skills` on first init.
