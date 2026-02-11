import { createTool, createToolkit, type Toolkit } from "@voltagent/core";
import { execa } from "execa";
import { z } from "zod";
import { voltlogger } from "../../config/logger.js";
import type { WorkspaceRuntime } from "../workspace-runtime.js";

const truncate = (text: string, maxChars: number): { text: string; truncated: boolean } => {
    if (text.length <= maxChars) {
        return { text, truncated: false };
    }
    return { text: text.slice(0, maxChars) + "\n...<truncated>", truncated: true };
};

export const createWorkspaceSandboxToolkit = (workspace: WorkspaceRuntime): Toolkit => {
    const policy = (toolName: string) => workspace.getPolicy("sandbox", toolName);

    const executeCommandTool = createTool({
        name: "execute_command",
        description: "Execute a shell command inside the workspace sandbox root.",
        needsApproval: policy("execute_command").needsApproval ?? true,
        parameters: z.object({
            command: z.string().min(1).describe("Command to execute"),
            cwd: z.string().optional().describe("Workspace-relative working directory (default: sandbox root)") ,
            timeout_ms: z.number().int().positive().optional().default(10_000),
            env: z.record(z.string(), z.string()).optional().describe("Environment variables to pass"),
            max_output_kb: z.number().int().positive().optional().default(64),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }

            const cwd = workspace.resolveSandboxCwd(args.cwd);
            voltlogger.info("Sandbox execute_command", { cwd, command: args.command });

            const timeoutMs = Math.min(args.timeout_ms, workspace.operationTimeoutMs);

            const start = Date.now();
            try {
                const child = await execa(args.command, {
                    cwd,
                    env: args.env,
                    shell: true,
                    timeout: timeoutMs,
                    reject: false,
                });
                const durationMs = Date.now() - start;

                const maxChars = args.max_output_kb * 1024;
                const stdout = truncate(child.stdout ?? "", maxChars);
                const stderr = truncate(child.stderr ?? "", maxChars);

                return {
                    stdout: stdout.text,
                    stderr: stderr.text,
                    exitCode: child.exitCode,
                    durationMs,
                    timedOut: child.timedOut ?? false,
                    aborted: false,
                    stdoutTruncated: stdout.truncated,
                    stderrTruncated: stderr.truncated,
                };
            } catch (error) {
                const durationMs = Date.now() - start;
                const message = error instanceof Error ? error.message : String(error);
                return {
                    stdout: "",
                    stderr: message,
                    exitCode: 1,
                    durationMs,
                    timedOut: false,
                    aborted: false,
                    stdoutTruncated: false,
                    stderrTruncated: false,
                };
            }
        },
    });

    return createToolkit({
        name: "workspace_sandbox",
        description: "Sandbox command execution toolkit scoped to a workspace sandbox directory.",
        instructions:
            "Use execute_command for short-lived tasks. Prefer passing only required env vars and keep timeouts tight.",
        addInstructions: true,
        tools: [executeCommandTool],
    });
};
