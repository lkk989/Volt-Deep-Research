import { NodeFilesystemBackend } from "@voltagent/core";
import { promises as fs } from "node:fs";
import path from "node:path";

export type WorkspaceToolPolicy = {
    enabled?: boolean;
    needsApproval?: boolean;
    requireReadBeforeWrite?: boolean;
};

export type WorkspaceToolPolicies = {
    defaults?: WorkspaceToolPolicy;
    tools?: Record<string, WorkspaceToolPolicy>;
};

export type WorkspaceToolConfig = {
    filesystem?: WorkspaceToolPolicies;
    sandbox?: WorkspaceToolPolicies;
    search?: WorkspaceToolPolicies;
    skills?: WorkspaceToolPolicies;
};

export type WorkspaceRuntimeOptions = {
    id: string;
    operationTimeoutMs?: number;
    filesystemRootDir: string;
    sandboxRootDir: string;
    skillsSeedDir?: string;
    toolConfig?: WorkspaceToolConfig;
};

type ReadVersion = {
    mtimeMs: number;
    size: number;
};

type OperationKey = string;

export class WorkspaceRuntime {
    public readonly id: string;
    public readonly operationTimeoutMs: number;
    public readonly filesystemRootDir: string;
    public readonly sandboxRootDir: string;
    public readonly skillsSeedDir?: string;
    public readonly toolConfig: WorkspaceToolConfig;

    private readonly filesystemBackend: NodeFilesystemBackend;
    private readonly readsByOperation = new Map<OperationKey, Map<string, ReadVersion>>();

    public constructor(options: WorkspaceRuntimeOptions) {
        this.id = options.id;
        this.operationTimeoutMs = options.operationTimeoutMs ?? 30_000;
        this.filesystemRootDir = options.filesystemRootDir;
        this.sandboxRootDir = options.sandboxRootDir;
        this.skillsSeedDir = options.skillsSeedDir;
        this.toolConfig = options.toolConfig ?? {};

        this.filesystemBackend = new NodeFilesystemBackend({
            rootDir: this.filesystemRootDir,
            virtualMode: true,
            maxFileSizeMb: 25,
        });
    }

    public getFilesystemBackend(): NodeFilesystemBackend {
        return this.filesystemBackend;
    }

    public async init(): Promise<void> {
        await fs.mkdir(this.filesystemRootDir, { recursive: true });
        await fs.mkdir(this.sandboxRootDir, { recursive: true });

        if (this.skillsSeedDir) {
            await this.seedSkillsIfMissing();
        }
    }

    public async destroy(): Promise<void> {
        this.readsByOperation.clear();
    }

    public getPolicy(toolkit: keyof WorkspaceToolConfig, toolName: string): WorkspaceToolPolicy {
        const toolkitPolicy = this.toolConfig[toolkit] ?? {};
        const defaults = toolkitPolicy.defaults ?? {};
        const override = toolkitPolicy.tools?.[toolName] ?? {};
        return { ...defaults, ...override };
    }

    public getOperationKey(options?: { operationId?: string; conversationId?: string; toolCallId?: string }): OperationKey {
        return options?.operationId ?? `${options?.conversationId ?? "unknown"}:${options?.toolCallId ?? "unknown"}`;
    }

    public async recordRead(operationKey: OperationKey, workspacePath: string): Promise<void> {
        const version = await this.getPathVersion(workspacePath);
        if (!version) {
            return;
        }

        const reads = this.readsByOperation.get(operationKey) ?? new Map<string, ReadVersion>();
        reads.set(workspacePath, version);
        this.readsByOperation.set(operationKey, reads);
    }

    public async assertReadBeforeWrite(operationKey: OperationKey, workspacePath: string): Promise<void> {
        const reads = this.readsByOperation.get(operationKey);
        const prior = reads?.get(workspacePath);
        if (!prior) {
            throw new Error(`Read-before-write required for ${workspacePath}. Call read_file first.`);
        }

        const current = await this.getPathVersion(workspacePath);
        if (!current) {
            throw new Error(`Read-before-write required for ${workspacePath}. File no longer exists.`);
        }

        if (prior.mtimeMs !== current.mtimeMs || prior.size !== current.size) {
            throw new Error(`Read-before-write required for ${workspacePath}. File changed since last read; re-read it.`);
        }
    }

    public resolveSandboxCwd(workspaceCwd?: string): string {
        if (!workspaceCwd) {
            return this.sandboxRootDir;
        }

        const normalized = this.normalizeWorkspacePath(workspaceCwd);
        const rel = normalized === "/" ? "" : normalized.slice(1);
        const full = path.resolve(this.sandboxRootDir, rel);
        const relativeToRoot = path.relative(this.sandboxRootDir, full);
        if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
            throw new Error("Sandbox cwd must stay within sandbox root");
        }
        return full;
    }

    public normalizeWorkspacePath(inputPath: string): string {
        const withSlash = inputPath.startsWith("/") ? inputPath : `/${inputPath}`;
        if (withSlash.includes("..") || withSlash.startsWith("~")) {
            throw new Error("Path traversal not allowed");
        }
        return withSlash.replace(/\\/g, "/");
    }

    private async getPathVersion(workspacePath: string): Promise<ReadVersion | null> {
        const normalized = this.normalizeWorkspacePath(workspacePath);
        try {
            const full = this.resolveWorkspacePathToHost(normalized);
            const stat = await fs.stat(full);
            return { mtimeMs: stat.mtimeMs, size: stat.size };
        } catch {
            return null;
        }
    }

    private resolveWorkspacePathToHost(workspacePath: string): string {
        const normalized = this.normalizeWorkspacePath(workspacePath);
        const rel = normalized === "/" ? "" : normalized.slice(1);
        const full = path.resolve(this.filesystemRootDir, rel);
        const relativeToRoot = path.relative(this.filesystemRootDir, full);
        if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
            throw new Error("Path outside workspace filesystem root");
        }
        return full;
    }

    private async seedSkillsIfMissing(): Promise<void> {
        if (!this.skillsSeedDir) {
            return;
        }

        const skillsRoot = path.join(this.filesystemRootDir, "skills");
        const exists = await fs
            .stat(skillsRoot)
            .then(() => true)
            .catch(() => false);
        if (exists) {
            return;
        }

        await copyDirectory(this.skillsSeedDir, skillsRoot);
    }
}

export function createDefaultWorkspaceRuntime(): WorkspaceRuntime {
    const root = path.resolve(process.cwd(), ".workspace");
    return new WorkspaceRuntime({
        id: "mastervolt",
        filesystemRootDir: path.join(root, "fs"),
        sandboxRootDir: path.join(root, "sandbox"),
        skillsSeedDir: path.resolve(process.cwd(), "voltagent/workspaces/seed/skills"),
        toolConfig: {
            filesystem: {
                defaults: { needsApproval: false },
                tools: {
                    delete_file: { needsApproval: true, requireReadBeforeWrite: true },
                    write_file: { needsApproval: true },
                    edit_file: { needsApproval: true, requireReadBeforeWrite: true },
                },
            },
            sandbox: {
                defaults: { needsApproval: true },
            },
        },
    });
}

async function copyDirectory(fromDir: string, toDir: string): Promise<void> {
    await fs.mkdir(toDir, { recursive: true });
    const entries = await fs.readdir(fromDir, { withFileTypes: true });
    await Promise.all(
        entries.map(async (entry) => {
            const src = path.join(fromDir, entry.name);
            const dst = path.join(toDir, entry.name);
            if (entry.isDirectory()) {
                await copyDirectory(src, dst);
                return;
            }
            await fs.copyFile(src, dst);
        })
    );
}
