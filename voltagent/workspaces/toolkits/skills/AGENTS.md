# voltagent/workspaces/toolkits/skills/AGENTS.md

This folder contains helpers used by the Workspace Skills toolkit.

Upstream reference:

- Skills: <https://voltagent.dev/docs/workspaces/skills/>

## frontmatter.ts

Parses the YAML frontmatter in `SKILL.md` files.

The skills toolkit uses frontmatter to:

- display name/description/tags in `workspace_list_skills`
- enforce allowlists for `references`, `scripts`, and `assets`

Security note:

- Only allowlisted paths from `SKILL.md` are readable via skill file tools.
- Paths are treated as relative to the skill directory.
