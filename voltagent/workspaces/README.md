# Workspaces (local implementation)

This project currently ships a local `voltagent/workspaces` implementation that mirrors the VoltAgent Workspace docs:

- Filesystem: workspace-scoped virtual filesystem tools
- Search: BM25 / vector / hybrid search over indexed workspace content
- Sandbox: `execute_command` timeboxed command runner rooted under a sandbox directory
- Skills: discoverable `SKILL.md` folders with allowlisted references/scripts/assets + optional prompt injection hook
- Security: per-tool enable/disable + `needsApproval` + optional read-before-write enforcement

Upstream references:

- Workspace: <https://voltagent.dev/docs/workspaces/>
- Filesystem: <https://voltagent.dev/docs/workspaces/filesystem/>
- Search: <https://voltagent.dev/docs/workspaces/search/>
- Sandbox: <https://voltagent.dev/docs/workspaces/sandbox/>
- Skills: <https://voltagent.dev/docs/workspaces/skills/>
- Security: <https://voltagent.dev/docs/workspaces/security/>

See `AGENTS.md` files in this folder (and subfolders) for implementation-specific behavior, policy enforcement, and constraints.

## Quick start

```ts
import { createDefaultWorkspaceRuntime } from "./workspaces/index.js";
import { createWorkspaceFilesystemToolkit } from "./workspaces/index.js";

const workspace = createDefaultWorkspaceRuntime();
await workspace.init();

// Then attach toolkits to an agent:
// toolkits: [createWorkspaceFilesystemToolkit(workspace), ...]
```

## Notes

- Paths are workspace-relative and must start with `/`.
- The workspace filesystem root defaults to `./.workspace/fs`.
- The sandbox root defaults to `./.workspace/sandbox`.
- Skills are seeded into `/.workspace/fs/skills` from `voltagent/workspaces/seed/skills` on first init.
