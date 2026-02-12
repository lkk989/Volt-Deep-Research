export type { WorkspaceRuntimeOptions, WorkspaceToolConfig } from "./workspace-runtime.js";
export { WorkspaceRuntime, createDefaultWorkspaceRuntime } from "./workspace-runtime.js";
export { createWorkspaceFilesystemToolkit } from "./toolkits/filesystem-toolkit.js";
export { createWorkspaceSandboxToolkit } from "./toolkits/sandbox-toolkit.js";
export { createWorkspaceSearchToolkit } from "./toolkits/search-toolkit.js";
export { createWorkspaceSkillsToolkit, createWorkspaceSkillsPromptHook } from "./toolkits/skills-toolkit.js";

import { createWorkspaceFilesystemToolkit } from "./toolkits/filesystem-toolkit.js";
import { createWorkspaceSandboxToolkit } from "./toolkits/sandbox-toolkit.js";
import { createWorkspaceSearchToolkit } from "./toolkits/search-toolkit.js";
import { createWorkspaceSkillsPromptHook, createWorkspaceSkillsToolkit } from "./toolkits/skills-toolkit.js";
import { createDefaultWorkspaceRuntime } from "./workspace-runtime.js";

export const sharedWorkspaceRuntime = createDefaultWorkspaceRuntime();
export const sharedWorkspaceFilesystemToolkit = createWorkspaceFilesystemToolkit(sharedWorkspaceRuntime);
export const sharedWorkspaceSearchToolkit = createWorkspaceSearchToolkit(sharedWorkspaceRuntime);
export const sharedWorkspaceSandboxToolkit = createWorkspaceSandboxToolkit(sharedWorkspaceRuntime);
export const sharedWorkspaceSkillsToolkit = createWorkspaceSkillsToolkit(sharedWorkspaceRuntime);
export const sharedWorkspaceSkillsPromptHook = createWorkspaceSkillsPromptHook(sharedWorkspaceRuntime);
