import {
    createHooks,
    createTool,
    createToolkit,
    type OnPrepareModelMessagesHookArgs,
    type Toolkit,
} from "@voltagent/core";
import type { ModelMessage } from "ai";
import { z } from "zod";
import { voltlogger } from "../../config/logger.js";
import type { WorkspaceRuntime } from "../workspace-runtime.js";
import { parseFrontmatter } from "./skills/frontmatter.js";

interface SkillDescriptor {
    id: string;
    path: string;
    name: string;
    description?: string;
    body: string;
    tags: string[];
    references: string[];
    scripts: string[];
    assets: string[];
}

const SKILLS_ROOT_DEFAULT = "/skills";

const normalizeSkillId = (skillPath: string): string => skillPath.replace(/^\/skills\//, "").replace(/\/$/, "");

const buildSkill = (skillDir: string, skillMdPath: string, content: string): SkillDescriptor => {
    const parsed = parseFrontmatter(content);
    const name = typeof parsed.data.name === "string" ? parsed.data.name : normalizeSkillId(skillDir);
    const description = typeof parsed.data.description === "string" ? parsed.data.description : undefined;
    const tags = Array.isArray(parsed.data.tags) ? (parsed.data.tags as string[]) : [];
    const references = Array.isArray(parsed.data.references) ? (parsed.data.references as string[]) : [];
    const scripts = Array.isArray(parsed.data.scripts) ? (parsed.data.scripts as string[]) : [];
    const assets = Array.isArray(parsed.data.assets) ? (parsed.data.assets as string[]) : [];
    return {
        id: normalizeSkillId(skillDir),
        path: skillMdPath,
        name,
        description,
        body: parsed.body.trim(),
        tags,
        references,
        scripts,
        assets,
    };
};

export const createWorkspaceSkillsToolkit = (workspace: WorkspaceRuntime, options?: { rootPath?: string }): Toolkit => {
    const root = workspace.normalizeWorkspacePath(options?.rootPath ?? SKILLS_ROOT_DEFAULT);
    const backend = workspace.getFilesystemBackend();
    const activatedByConversation = new Map<string, Set<string>>();

    const discoverSkills = async (): Promise<SkillDescriptor[]> => {
        const matches = await backend.globInfo("**/SKILL.md", root);
        const files = matches.filter((m) => !(m.is_dir ?? false));
        const skills: SkillDescriptor[] = [];
        for (const file of files) {
            const skillMdPath = file.path;
            const skillDir = skillMdPath.replace(/\/SKILL\.md$/, "");
            const content = await backend.read(skillMdPath);
            skills.push(buildSkill(skillDir, skillMdPath, content));
        }
        return skills;
    };

    const listSkillsTool = createTool({
        name: "workspace_list_skills",
        description: "List available workspace skills.",
        parameters: z.object({}),
        execute: async (_, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const skills = await discoverSkills();
            return skills.map((s) => ({ id: s.id, name: s.name, description: s.description, tags: s.tags }));
        },
    });

    const searchSkillsTool = createTool({
        name: "workspace_search_skills",
        description: "Search skills by name/description/body (simple substring match).",
        parameters: z.object({
            query: z.string().min(1),
            top_k: z.number().int().positive().optional().default(10),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const skills = await discoverSkills();
            const q = args.query.toLowerCase();
            const hits = skills
                .map((s) => ({
                    skill: s,
                    score:
                        (s.name.toLowerCase().includes(q) ? 3 : 0) +
                        ((s.description ?? "").toLowerCase().includes(q) ? 2 : 0) +
                        (s.body.toLowerCase().includes(q) ? 1 : 0),
                }))
                .filter((h) => h.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, args.top_k);
            return hits.map((h) => ({ id: h.skill.id, name: h.skill.name, description: h.skill.description, score: h.score }));
        },
    });

    const readSkillTool = createTool({
        name: "workspace_read_skill",
        description: "Read the full SKILL.md for a skill.",
        parameters: z.object({ skill_id: z.string().min(1) }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const skills = await discoverSkills();
            const skill = skills.find((s) => s.id === args.skill_id);
            if (!skill) {
                throw new Error(`Skill not found: ${args.skill_id}`);
            }
            const content = await backend.read(skill.path);
            return { id: skill.id, path: skill.path, content };
        },
    });

    const activateSkillTool = createTool({
        name: "workspace_activate_skill",
        description: "Activate a skill for the current conversation.",
        parameters: z.object({ skill_id: z.string().min(1) }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const skills = await discoverSkills();
            const skill = skills.find((s) => s.id === args.skill_id);
            if (!skill) {
                throw new Error(`Skill not found: ${args.skill_id}`);
            }
            const conversationId = execOptions?.conversationId ?? "unknown";
            const set = activatedByConversation.get(conversationId) ?? new Set<string>();
            set.add(args.skill_id);
            activatedByConversation.set(conversationId, set);
            return { conversationId, activated: [...set] };
        },
    });

    const deactivateSkillTool = createTool({
        name: "workspace_deactivate_skill",
        description: "Deactivate a skill for the current conversation.",
        parameters: z.object({ skill_id: z.string().min(1) }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const skills = await discoverSkills();
            const skill = skills.find((s) => s.id === args.skill_id);
            if (!skill) {
                throw new Error(`Skill not found: ${args.skill_id}`);
            }
            const conversationId = execOptions?.conversationId ?? "unknown";
            const set = activatedByConversation.get(conversationId) ?? new Set<string>();
            set.delete(args.skill_id);
            activatedByConversation.set(conversationId, set);
            return { conversationId, activated: [...set] };
        },
    });

    const readSkillFileToolFactory = (toolName: string, kind: "references" | "scripts" | "assets") =>
        createTool({
            name: toolName,
            description: `Read a skill ${kind.slice(0, -1)} file (allowlisted in SKILL.md).`,
            parameters: z.object({
                skill_id: z.string().min(1),
                file: z.string().min(1).describe("Relative path under the skill directory"),
            }),
            execute: async (args, execOptions) => {
                if (execOptions?.isActive === false) {
                    throw new Error("Operation has been cancelled");
                }
                const skills = await discoverSkills();
                const skill = skills.find((s) => s.id === args.skill_id);
                if (!skill) {
                    throw new Error(`Skill not found: ${args.skill_id}`);
                }

                const allowlist = new Set<string>(skill[kind]);
                if (!allowlist.has(args.file)) {
                    throw new Error(`File not allowlisted in SKILL.md (${kind}): ${args.file}`);
                }

                const skillDir = skill.path.replace(/\/SKILL\.md$/, "");
                const target = workspace.normalizeWorkspacePath(`${skillDir}/${args.file}`);
                const content = await backend.read(target);
                return { path: target, content };
            },
        });

    const readReferenceTool = readSkillFileToolFactory("workspace_read_skill_reference", "references");
    const readScriptTool = readSkillFileToolFactory("workspace_read_skill_script", "scripts");
    const readAssetTool = readSkillFileToolFactory("workspace_read_skill_asset", "assets");

    return createToolkit({
        name: "workspace_skills",
        description: "Discover, activate, and read workspace skills stored as SKILL.md folders.",
        instructions:
            "Use workspace_list_skills and workspace_search_skills to discover capabilities. Activate relevant skills to inject their instructions into the agent prompt.",
        addInstructions: true,
        tools: [
            listSkillsTool,
            searchSkillsTool,
            readSkillTool,
            activateSkillTool,
            deactivateSkillTool,
            readReferenceTool,
            readScriptTool,
            readAssetTool,
        ],
    });
};

export const createWorkspaceSkillsPromptHook = (workspace: WorkspaceRuntime, options?: { rootPath?: string }) => {
    const root = options?.rootPath ?? SKILLS_ROOT_DEFAULT;
    const backend = workspace.getFilesystemBackend();

    const loadAllSkills = async (): Promise<string> => {
        const matches = await backend.globInfo("**/SKILL.md", root);
        const files = matches.filter((m) => !(m.is_dir ?? false));
        const contents = await Promise.all(files.map((f) => backend.read(f.path)));
        return contents.join("\n\n---\n\n");
    };

    return createHooks({
        onPrepareModelMessages: async (args: OnPrepareModelMessagesHookArgs) => {
            const skills = await loadAllSkills();
            if (skills.trim().length === 0) {
                return {};
            }
            voltlogger.debug("Injecting workspace skills into prompt");
            const injection = `<workspace_skills>\n${skills}\n</workspace_skills>`;

            const systemMessage: ModelMessage = {
                role: "system",
                content: injection,
            };

            return {
                modelMessages: [systemMessage, ...args.modelMessages],
            };
        },
    });
};
