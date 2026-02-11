# voltagent/workspaces/seed/skills/common/data-analysis/AGENTS.md

This is an example Workspace Skill: `data-analysis`.

Upstream reference:

- SKILL.md format: <https://voltagent.dev/docs/workspaces/skills/>

## Files

- `SKILL.md`: frontmatter + instructions
- `references/schema.md`: example reference doc (allowlisted)
- `scripts/analyze.ts`: example analysis script (allowlisted)
- `assets/sample.csv`: example dataset (allowlisted)

## What this is used for

- Validates that skill discovery works (`workspace_list_skills` finds it).
- Validates allowlisted file reads work (`workspace_read_skill_reference/script/asset`).
- Provides a concrete test case for prompt injection via `<workspace_skills>`.
