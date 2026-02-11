# voltagent/workspaces/toolkits/AGENTS.md

This directory contains the **Workspace toolkits** that expose workspace capabilities as agent-callable tools.

Upstream references:

- Filesystem: <https://voltagent.dev/docs/workspaces/filesystem/>
- Search: <https://voltagent.dev/docs/workspaces/search/>
- Sandbox: <https://voltagent.dev/docs/workspaces/sandbox/>
- Skills: <https://voltagent.dev/docs/workspaces/skills/>
- Security / policies: <https://voltagent.dev/docs/workspaces/security/>

## Toolkits

### filesystem-toolkit.ts (Workspace Filesystem)

Implements the workspace filesystem tool surface.

Tools:

- `ls`
- `read_file`
- `write_file`
- `edit_file`
- `delete_file`
- `stat`
- `mkdir`
- `rmdir`
- `list_tree` (and `list_files` alias)
- `glob`
- `grep`

Tool parameters (summary):

- `ls`: `{ path }`
- `read_file`: `{ path, offset?, limit? }`
- `write_file`: `{ path, content, overwrite=false, create_parent_dirs=true }`
- `edit_file`: `{ path, old_string, new_string, replace_all=false }`
- `delete_file`: `{ path, recursive=false }`
- `stat`: `{ path }`
- `mkdir`: `{ path, recursive=true }`
- `rmdir`: `{ path, recursive=false }`
- `list_tree`: `{ path, max_depth=4 }`
- `glob`: `{ pattern, path? }`
- `grep`: `{ pattern, path?, glob? }`

Key behaviors:

- Paths are workspace-virtual and must start with `/`.
- Host filesystem access is contained under `WorkspaceRuntime.filesystemRootDir`.
- Supports `readOnly` mode (hides write tools and blocks writes).
- Honors tool policies via `WorkspaceRuntime.getPolicy("filesystem", toolName)`.
- Can enforce read-before-write using `WorkspaceRuntime.recordRead()` + `assertReadBeforeWrite()`.

Read-before-write behavior (docs: Security + Filesystem):

- When `requireReadBeforeWrite` is enabled for a tool/path, the toolkit requires a prior `read_file` call for the same operation.
- If the file changed since the last read (mtime/size), the toolkit fails and requires re-reading.

Read-only mode behavior (docs: Filesystem):

- If the toolkit is created with `{ readOnly: true }`, mutating tools are hidden and any attempted write/edit/delete throws.

### search-toolkit.ts (Workspace Search)

Implements indexing + hybrid search over workspace content.

Tools:

- `workspace_index`: index files under a path + glob
- `workspace_index_content`: index raw content under a virtual path
- `workspace_search`: BM25 / vector / hybrid

Tool parameters (summary):

- `workspace_index`: `{ path, glob="**/*", max_files=200 }`
- `workspace_index_content`: `{ path, content, source="manual" }`
- `workspace_search`:
  - `query`
  - `mode`: `bm25 | vector | hybrid` (default: `hybrid`)
  - `top_k` (default: `5`)
  - `min_score` (0..1)
  - `include_content` (default: `true`)
  - `snippet_length` (default: `200`)
  - `vector_weight` (0..1, default: `0.6`)

Key behaviors:

- Tool-driven indexing (no implicit auto-index).
- Hybrid scoring combines normalized BM25 and vector similarity.
- `include_content: false` + `snippet_length` reduces token usage in results.

Result fields (matching upstream semantics):

- `score`: normalized (0..1)
- `scoreDetails`: `{ bm25?, vector? }`
- `content`: full content (when `include_content: true`)
- `snippet`: excerpt around the first matching line
- `lineRange`: 1-based `[startLine, endLine]` around the snippet

### sandbox-toolkit.ts (Workspace Sandbox)

Implements timeboxed command execution rooted under the sandbox directory.

Tool:

- `execute_command`

Tool parameters (summary):

- `execute_command`: `{ command, cwd?, timeout_ms=10000, env?, max_output_kb=64 }`

Tool result fields:

- `stdout`, `stderr`
- `exitCode`
- `durationMs`
- `timedOut`
- `aborted`
- `stdoutTruncated`, `stderrTruncated`

Key behaviors:

- `cwd` is resolved under `WorkspaceRuntime.sandboxRootDir`.
- Tool timeout is capped by `WorkspaceRuntime.operationTimeoutMs`.
- Output truncation prevents excessive tool responses.

Security expectations (docs: Sandbox + Security):

- Keep timeouts tight.
- Prefer passing only required env vars.
- Sandbox execution is treated as a privileged capability and is typically `needsApproval: true`.

### skills-toolkit.ts (Workspace Skills)

Implements skill discovery + activation + allowlisted file reads, plus an optional prompt injection hook.

Tools:

- `workspace_list_skills`
- `workspace_search_skills`
- `workspace_read_skill`
- `workspace_activate_skill`
- `workspace_deactivate_skill`
- `workspace_read_skill_reference`
- `workspace_read_skill_script`
- `workspace_read_skill_asset`

Tool parameters (summary):

- `workspace_search_skills`: `{ query, top_k=10 }`
- `workspace_read_skill`: `{ skill_id }`
- `workspace_activate_skill`: `{ skill_id }`
- `workspace_deactivate_skill`: `{ skill_id }`
- `workspace_read_skill_reference/script/asset`: `{ skill_id, file }` where `file` must be allowlisted in `SKILL.md`.

Prompt hook:

- `createWorkspaceSkillsPromptHook()` prepends a system `ModelMessage` containing `<workspace_skills>...</workspace_skills>`.

Prompt injection notes (docs: Skills):

- Skills are wrapped in `<workspace_skills>` tags so the model can reliably parse the section.
- System prompt injection uses the AI SDK message type `ModelMessage` with `{ role: "system", content: string }`.

## Policies and approvals

Each toolkit reads policy via `WorkspaceRuntime.getPolicy(<toolkit>, <toolName>)` and applies:

- `enabled`: include/exclude tools from the toolkit
- `needsApproval`: mark sensitive tools for approval in tool execution
- `requireReadBeforeWrite`: enforce `read_file` before modifying paths (filesystem toolkit)
