import { createTool, createToolkit, type Toolkit, type ToolExecuteOptions } from "@voltagent/core";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { voltlogger } from "../../config/logger.js";
import type { WorkspaceRuntime } from "../workspace-runtime.js";

interface FilesystemToolkitOptions {
    readOnly?: boolean;
}

const resolveHostPath = (workspace: WorkspaceRuntime, workspacePath: string): string => {
    const normalized = workspace.normalizeWorkspacePath(workspacePath);
    const rel = normalized === "/" ? "" : normalized.slice(1);
    const full = path.resolve(workspace.filesystemRootDir, rel);
    const relativeToRoot = path.relative(workspace.filesystemRootDir, full);
    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
        throw new Error("Path outside workspace filesystem root");
    }
    return full;
};

const getTimeoutSignal = (timeoutMs: number, options?: ToolExecuteOptions): AbortSignal => {
    const upstream = options?.toolContext?.abortSignal;
    const local = AbortSignal.timeout(timeoutMs);
    if (!upstream) {
        return local;
    }

    if (upstream.aborted) {
        return upstream;
    }

    const controller = new AbortController();
    const onAbort = (): void => controller.abort(upstream.reason);
    upstream.addEventListener("abort", onAbort, { once: true });
    local.addEventListener("abort", () => controller.abort(local.reason), { once: true });
    return controller.signal;
};

export const createWorkspaceFilesystemToolkit = (
    workspace: WorkspaceRuntime,
    options?: FilesystemToolkitOptions
): Toolkit => {
    const backend = workspace.getFilesystemBackend();
    const readOnly = options?.readOnly ?? false;

    const toolEnabled = (name: string): boolean => workspace.getPolicy("filesystem", name).enabled ?? true;

    const lsTool = createTool({
        name: "ls",
        description: "List files and directories in a workspace directory.",
        parameters: z.object({
            path: z.string().describe("Workspace path starting with /")
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const listing = await backend.lsInfo(args.path);
            return { path: workspace.normalizeWorkspacePath(args.path), entries: listing };
        },
    });

    const readFileTool = createTool({
        name: "read_file",
        description: "Read a text file from the workspace filesystem.",
        parameters: z.object({
            path: z.string().describe("Workspace file path starting with /") ,
            offset: z.number().int().nonnegative().optional().describe("0-based line offset"),
            limit: z.number().int().positive().optional().describe("Max lines to read")
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const content = await backend.read(args.path, args.offset, args.limit);
            const operationKey = workspace.getOperationKey({
                operationId: execOptions?.operationId,
                conversationId: execOptions?.conversationId,
                toolCallId: execOptions?.toolContext?.callId,
            });
            await workspace.recordRead(operationKey, workspace.normalizeWorkspacePath(args.path));

            return {
                path: workspace.normalizeWorkspacePath(args.path),
                content,
            };
        },
    });

    const writeFileTool = createTool({
        name: "write_file",
        description: "Write a file into the workspace filesystem.",
        needsApproval: workspace.getPolicy("filesystem", "write_file").needsApproval,
        parameters: z.object({
            path: z.string().describe("Workspace file path starting with /") ,
            content: z.string().describe("File contents"),
            overwrite: z.boolean().optional().default(false).describe("Overwrite if the file exists"),
            create_parent_dirs: z.boolean().optional().default(true).describe("Create parent directories if missing"),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            if (readOnly) {
                throw new Error("Workspace filesystem is read-only");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const normalized = workspace.normalizeWorkspacePath(args.path);
            const operationKey = workspace.getOperationKey({
                operationId: execOptions?.operationId,
                conversationId: execOptions?.conversationId,
                toolCallId: execOptions?.toolContext?.callId,
            });
            const policy = workspace.getPolicy("filesystem", "write_file");
            if (policy.requireReadBeforeWrite) {
                await workspace.assertReadBeforeWrite(operationKey, normalized);
            }

            if (args.create_parent_dirs) {
                const hostPath = resolveHostPath(workspace, normalized);
                await fs.mkdir(path.dirname(hostPath), { recursive: true });
            }

            const exists = await fs
                .stat(resolveHostPath(workspace, normalized))
                .then(() => true)
                .catch(() => false);
            if (exists && !args.overwrite) {
                throw new Error(`File already exists: ${normalized}`);
            }

            await backend.write(normalized, args.content);
            return { path: normalized, overwritten: exists };
        },
    });

    const editFileTool = createTool({
        name: "edit_file",
        description: "Edit a file by replacing a specific string.",
        needsApproval: workspace.getPolicy("filesystem", "edit_file").needsApproval,
        parameters: z.object({
            path: z.string().describe("Workspace file path starting with /") ,
            old_string: z.string().describe("Exact string to replace"),
            new_string: z.string().describe("Replacement string"),
            replace_all: z.boolean().optional().default(false).describe("Replace all occurrences"),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            if (readOnly) {
                throw new Error("Workspace filesystem is read-only");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const normalized = workspace.normalizeWorkspacePath(args.path);
            const operationKey = workspace.getOperationKey({
                operationId: execOptions?.operationId,
                conversationId: execOptions?.conversationId,
                toolCallId: execOptions?.toolContext?.callId,
            });
            const policy = workspace.getPolicy("filesystem", "edit_file");
            if (policy.requireReadBeforeWrite) {
                await workspace.assertReadBeforeWrite(operationKey, normalized);
            }

            const result = await backend.edit(normalized, args.old_string, args.new_string, args.replace_all);
            return { path: normalized, ...result };
        },
    });

    const deleteFileTool = createTool({
        name: "delete_file",
        description: "Delete a file or directory from the workspace filesystem.",
        needsApproval: workspace.getPolicy("filesystem", "delete_file").needsApproval,
        parameters: z.object({
            path: z.string().describe("Workspace path starting with /") ,
            recursive: z.boolean().optional().default(false).describe("Delete directories recursively"),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            if (readOnly) {
                throw new Error("Workspace filesystem is read-only");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const normalized = workspace.normalizeWorkspacePath(args.path);
            const operationKey = workspace.getOperationKey({
                operationId: execOptions?.operationId,
                conversationId: execOptions?.conversationId,
                toolCallId: execOptions?.toolContext?.callId,
            });
            const policy = workspace.getPolicy("filesystem", "delete_file");
            if (policy.requireReadBeforeWrite) {
                await workspace.assertReadBeforeWrite(operationKey, normalized);
            }

            const hostPath = resolveHostPath(workspace, normalized);
            const stat = await fs.stat(hostPath);
            if (stat.isDirectory()) {
                await fs.rm(hostPath, { recursive: args.recursive, force: true });
            } else {
                await fs.unlink(hostPath);
            }
            return { path: normalized, deleted: true };
        },
    });

    const mkdirTool = createTool({
        name: "mkdir",
        description: "Create a directory in the workspace filesystem.",
        needsApproval: workspace.getPolicy("filesystem", "mkdir").needsApproval,
        parameters: z.object({
            path: z.string().describe("Workspace directory path starting with /") ,
            recursive: z.boolean().optional().default(true),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            if (readOnly) {
                throw new Error("Workspace filesystem is read-only");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const normalized = workspace.normalizeWorkspacePath(args.path);
            const hostPath = resolveHostPath(workspace, normalized);
            await fs.mkdir(hostPath, { recursive: args.recursive });
            return { path: normalized, created: true };
        },
    });

    const rmdirTool = createTool({
        name: "rmdir",
        description: "Remove a directory from the workspace filesystem.",
        needsApproval: workspace.getPolicy("filesystem", "rmdir").needsApproval,
        parameters: z.object({
            path: z.string().describe("Workspace directory path starting with /") ,
            recursive: z.boolean().optional().default(false),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            if (readOnly) {
                throw new Error("Workspace filesystem is read-only");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }
            const normalized = workspace.normalizeWorkspacePath(args.path);
            const hostPath = resolveHostPath(workspace, normalized);
            await fs.rm(hostPath, { recursive: args.recursive, force: true });
            return { path: normalized, deleted: true };
        },
    });

    const statTool = createTool({
        name: "stat",
        description: "Get metadata for a workspace file or directory.",
        parameters: z.object({
            path: z.string().describe("Workspace path starting with /") ,
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }
            const normalized = workspace.normalizeWorkspacePath(args.path);
            const hostPath = resolveHostPath(workspace, normalized);
            const stat = await fs.stat(hostPath);
            return {
                path: normalized,
                is_dir: stat.isDirectory(),
                size: stat.size,
                modified_at: stat.mtime.toISOString(),
                created_at: stat.birthtime.toISOString(),
            };
        },
    });

    const globTool = createTool({
        name: "glob",
        description: "Find files in the workspace filesystem matching a glob pattern.",
        parameters: z.object({
            pattern: z.string().describe("Glob pattern, e.g. **/*.md"),
            path: z.string().optional().describe("Workspace directory to search under")
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }
            const files = await backend.globInfo(args.pattern, args.path);
            return { pattern: args.pattern, matches: files };
        },
    });

    const grepTool = createTool({
        name: "grep",
        description: "Search for a regex pattern in workspace files.",
        parameters: z.object({
            pattern: z.string().describe("Regex pattern"),
            path: z.string().optional().describe("Workspace directory to search") ,
            glob: z.string().optional().describe("Glob filter, e.g. **/*.ts")
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }
            const matches = await backend.grepRaw(args.pattern, args.path ?? undefined, args.glob ?? null);
            return { pattern: args.pattern, matches };
        },
    });

    const listTreeTool = createTool({
        name: "list_tree",
        description: "List files and directories recursively.",
        parameters: z.object({
            path: z.string().describe("Workspace directory path starting with /") ,
            max_depth: z.number().int().min(0).max(20).optional().default(4),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const signal = getTimeoutSignal(workspace.operationTimeoutMs, execOptions);
            if (signal.aborted) {
                throw new Error("Operation timed out");
            }

            const normalized = workspace.normalizeWorkspacePath(args.path);
            const hostRoot = resolveHostPath(workspace, normalized);
            const results: Array<{ path: string; is_dir: boolean }> = [];

            const walk = async (dir: string, depth: number): Promise<void> => {
                if (depth > args.max_depth) {
                    return;
                }
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const full = path.join(dir, entry.name);
                    const rel = path.relative(workspace.filesystemRootDir, full).split(path.sep).join("/");
                    const wpath = `/${rel}`;
                    if (entry.isDirectory()) {
                        results.push({ path: `${wpath}/`, is_dir: true });
                        await walk(full, depth + 1);
                    } else {
                        results.push({ path: wpath, is_dir: false });
                    }
                }
            };

            await walk(hostRoot, 0);
            return { path: normalized, entries: results };
        },
    });

    const listFilesTool = createTool({
        name: "list_files",
        description: "Alias for list_tree.",
        parameters: listTreeTool.parameters,
        execute: listTreeTool.execute,
    });

    const tools = [
        lsTool,
        readFileTool,
        globTool,
        grepTool,
        statTool,
        listTreeTool,
        listFilesTool,
        mkdirTool,
        rmdirTool,
        deleteFileTool,
        writeFileTool,
        editFileTool,
    ].filter((t) => toolEnabled(t.name));

    const visibleTools = readOnly
        ? tools.filter((t) => !["write_file", "edit_file", "delete_file", "mkdir", "rmdir"].includes(t.name))
        : tools;

    if (readOnly) {
        voltlogger.info("Workspace filesystem toolkit running in read-only mode");
    }

    return createToolkit({
        name: "workspace_filesystem",
        description: "Workspace-scoped filesystem tools (virtualized under a workspace root).",
        instructions:
            "All paths are workspace-relative and must start with /. Use read_file before modifying paths when policies require it.",
        addInstructions: true,
        tools: visibleTools,
    });
};
