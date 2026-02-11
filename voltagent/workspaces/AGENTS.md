# voltagent/workspaces/AGENTS.md

This folder contains a **local Workspace implementation** that follows the VoltAgent Workspace guides and tool surfaces, implemented with the primitives already used in this repo.

Reference docs (upstream):

- Workspace: <https://voltagent.dev/docs/workspaces/>
- Filesystem: <https://voltagent.dev/docs/workspaces/filesystem/>
- Search: <https://voltagent.dev/docs/workspaces/search/>
- Sandbox: <https://voltagent.dev/docs/workspaces/sandbox/>
- Skills: <https://voltagent.dev/docs/workspaces/skills/>
- Security: <https://voltagent.dev/docs/workspaces/security/>

Message types reference (used by prompt hooks):

- Message helpers / types: <https://voltagent.dev/docs/utils/message-helpers/>

## What this module provides

- `WorkspaceRuntime` (`workspace-runtime.ts`):
  - Owns per-workspace root directories (filesystem + sandbox).
  - Normalizes workspace paths and blocks traversal.
  - Tracks read-before-write state per operation (for policies).
  - Optionally seeds initial skills into the workspace filesystem.

- Toolkits (`toolkits/*.ts`):
  - `filesystem-toolkit.ts`: `ls`, `read_file`, `write_file`, `edit_file`, `delete_file`, `stat`, `mkdir`, `rmdir`, `list_tree`, `glob`, `grep`.
  - `search-toolkit.ts`: `workspace_index`, `workspace_index_content`, `workspace_search` (BM25/vector/hybrid).
  - `sandbox-toolkit.ts`: `execute_command` timeboxed shell execution rooted under the sandbox dir.
  - `skills-toolkit.ts`: skill discovery/activation + allowlisted file reads + optional prompt injection hook.

- `seed/skills/`: initial `SKILL.md` examples copied into the workspace filesystem on first init.

## How this maps to the upstream Workspace docs

Upstream `Workspace` is configured with `filesystem`, `search`, `sandbox`, and `skills` options. In this repo we keep those same concepts, but expose them as:

- `WorkspaceRuntime` (owns roots + policy enforcement + read-before-write tracking)
- Individual toolkits (filesystem/search/sandbox/skills)

This lets us keep workspace behavior explicit and easy to wire into whichever agent(s) need it.

## Filesystem (docs: /workspaces/filesystem)

Implemented by:

- `WorkspaceRuntime.getFilesystemBackend()` (NodeFilesystemBackend in `virtualMode`)
- `toolkits/filesystem-toolkit.ts`

Tools implemented (matching the docs list):

- `ls`
- `read_file`
- `write_file`
- `edit_file`
- `delete_file`
- `stat`
- `mkdir`
- `rmdir`
- `list_tree` (+ `list_files` alias)
- `glob`
- `grep`

Behavior and constraints:

- All tool paths are workspace-relative and must start with `/`.
- Host path resolution is always contained under `workspace.filesystemRootDir`.
- Optional read-only mode is supported by `createWorkspaceFilesystemToolkit(workspace, { readOnly: true })`.
- Read-before-write enforcement is implemented via `WorkspaceRuntime.recordRead()` + `assertReadBeforeWrite()`.

## Search (docs: /workspaces/search)

Implemented by:

- `toolkits/search-toolkit.ts`

Tools implemented:

- `workspace_index`: index files under a path + glob
- `workspace_index_content`: index raw content under a virtual path
- `workspace_search`: BM25 / vector / hybrid

Notes / differences from upstream:

- Upstream supports configuration like `autoIndexPaths` and opt-in direct search API. This local implementation is tool-driven: you must call `workspace_index` (or `workspace_index_content`) before `workspace_search` will return results.
- Vector search uses `AiSdkEmbeddingAdapter(google.textEmbedding("gemini-embedding-001"))` with `InMemoryVectorAdapter`.

## Sandbox (docs: /workspaces/sandbox)

Implemented by:

- `toolkits/sandbox-toolkit.ts`

Tool implemented:

- `execute_command`

Behavior and constraints:

- `cwd` is workspace-relative and resolved under `workspace.sandboxRootDir`.
- `timeout_ms` is capped by the workspace-level `operationTimeoutMs` (see Security).
- Output is truncated via `max_output_kb` to avoid runaway tool responses.

Notes / differences from upstream:

- Upstream uses `LocalSandbox` with optional OS-level isolation (macOS `sandbox-exec`, Linux `bwrap`) and optional remote providers.
- This repo uses `execa(..., { shell: true })` rooted under the sandbox directory for portability. It does not provide container isolation.

## Skills (docs: /workspaces/skills)

Implemented by:

- `toolkits/skills-toolkit.ts`
- `toolkits/skills/frontmatter.ts` (YAML frontmatter parsing)
- `seed/skills/**` (example skills)

Skill layout (matching docs):

- Skills live under `/skills` in the workspace filesystem.
- Each skill is a directory containing a `SKILL.md`.
- `SKILL.md` contains YAML frontmatter plus Markdown body.

Allowlisting:

- Only files listed under `references`, `scripts`, or `assets` in `SKILL.md` are readable via the skill file tools.

Activation + prompt injection:

- Skills can be activated per conversation via `workspace_activate_skill`.
- `createWorkspaceSkillsPromptHook()` injects skills into the system prompt wrapped in `<workspace_skills>...</workspace_skills>`.
- The hook uses the AI SDK `ModelMessage` type (`role: "system"`) to prepend a system message.

## Security (docs: /workspaces/security)

Implemented by:

- `WorkspaceRuntime.toolConfig` + `WorkspaceRuntime.getPolicy()`
- Policy checks and read-before-write enforcement in the filesystem toolkit
- Timeboxing via `WorkspaceRuntime.operationTimeoutMs` and toolkit-specific timeouts

Supported knobs:

- `enabled`: hide/disable tools
- `needsApproval`: mark tools for approval
- `requireReadBeforeWrite`: force a `read_file` before write/edit/delete when enabled
- `operationTimeoutMs`: global timebox applied by toolkits

`createDefaultWorkspaceRuntime()` configures conservative defaults (writes require approval; delete/edit require read-before-write).

## Design constraints (security + correctness)

- **Workspace paths are virtual** and must start with `/`.
- **No path traversal**: inputs containing `..` or `~` must be rejected.
- **Filesystem containment**: resolve host paths under `workspace.filesystemRootDir` only.
- **Sandbox containment**: resolve sandbox `cwd` under `workspace.sandboxRootDir` only.
- **Timeboxing**: tool implementations should respect `workspace.operationTimeoutMs`.
- **Policy enforcement**: tool enable/disable + approval + optional read-before-write.

## How to use

```ts
import {
    createDefaultWorkspaceRuntime,
    createWorkspaceFilesystemToolkit,
    createWorkspaceSearchToolkit,
    createWorkspaceSandboxToolkit,
    createWorkspaceSkillsToolkit,
    createWorkspaceSkillsPromptHook,
} from "./workspaces/index.js";

const workspace = createDefaultWorkspaceRuntime();
await workspace.init();

const toolkits = [
    createWorkspaceFilesystemToolkit(workspace),
    createWorkspaceSearchToolkit(workspace),
    createWorkspaceSandboxToolkit(workspace),
    createWorkspaceSkillsToolkit(workspace),
];

const hooks = createWorkspaceSkillsPromptHook(workspace);
```

## Editing guidance

- Prefer self-explanatory code over comments; comment only for non-obvious constraints.
- Keep tool outputs compact and stable (these are agent-facing APIs).
- Avoid exposing absolute host paths in tool results.
