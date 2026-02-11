# voltagent/workspaces/seed/AGENTS.md

This directory contains seed data copied into the workspace filesystem during `WorkspaceRuntime.init()`.

## Why seeding exists

Upstream Workspaces assume `/skills` may already exist inside the workspace filesystem.
This repo seeds a small set of example skills so the skills toolkit is usable immediately after first init.

## How it works

- `WorkspaceRuntime.seedSkillsIfMissing()` checks whether `<filesystemRootDir>/skills` exists.
- If missing, it copies `voltagent/workspaces/seed/skills` into `<filesystemRootDir>/skills`.

Notes:

- Seeding only happens once (first init) unless you delete the workspace filesystem root.
- Seed data is treated as read-only examples; agents should not rely on it for persistence.
