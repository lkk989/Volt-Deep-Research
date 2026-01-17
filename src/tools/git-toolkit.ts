import { createTool, createToolkit, type Toolkit } from "@voltagent/core";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { voltlogger } from "../config/logger.js";

const execAsync = promisify(exec);

export const gitToolkit = createToolkit({
  name: "git_toolkit",
  description: "Tools for Git version control operations including status, diff, log, and commits.",
  instructions: `
Use these tools to interact with Git repositories:
1. **git_status**: Check for modified, staged, or untracked files.
2. **git_diff**: View line-by-line changes for specific files or the whole repo.
3. **git_log**: View commit history to understand recent changes.
4. **git_commit**: Create a new commit with a descriptive message.
5. **git_branch_operations**: Create, list, or switch branches.
  `,
  tools: [
    createTool({
      name: "git_status",
      description: "Get the current status of the git repository (modified, staged, untracked files).",
      parameters: z.object({}),
      execute: async (_, context) => {
        try {
          const { stdout } = await execAsync("git status --porcelain");
          const { stdout: branchInfo } = await execAsync("git branch --show-current");

          const files = stdout.split("\n").filter(Boolean).map(line => {
            const status = line.substring(0, 2);
            const file = line.substring(3);
            return { status, file };
          });

          return {
            branch: branchInfo.trim(),
            clean: files.length === 0,
            files
          };
        } catch (error) {
          throw new Error(`Git status failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    }),
    createTool({
      name: "git_diff",
      description: "Get the diff of changes. Can specify files or check staged/unstaged changes.",
      parameters: z.object({
        files: z.array(z.string()).optional().describe("Specific files to diff"),
        staged: z.boolean().default(false).describe("Show staged changes (git diff --cached)"),
      }),
      execute: async ({ files, staged }, context) => {
        try {
          const args = ["diff"];
          if (staged) {args.push("--cached");}
          if (files && files.length > 0) {args.push("--", ...files);}

          const { stdout } = await execAsync(`git ${args.join(" ")}`);
          return { diff: stdout || "No changes" };
        } catch (error) {
          throw new Error(`Git diff failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    }),
    createTool({
      name: "git_log",
      description: "Get the commit history.",
      parameters: z.object({
        maxCount: z.number().default(10).describe("Number of commits to show"),
        author: z.string().optional(),
      }),
      execute: async ({ maxCount, author }, context) => {
        try {
          let cmd = `git log -n ${maxCount} --pretty=format:"%h|%an|%ad|%s"`;
          if (author) {cmd += ` --author="${author}"`;}

          const { stdout } = await execAsync(cmd);
          const commits = stdout.split("\n").filter(Boolean).map(line => {
            const [hash, commitAuthor, date, message] = line.split("|");
            return { hash, author: commitAuthor, date, message };
          });

          return { commits };
        } catch (error) {
          throw new Error(`Git log failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    }),
    createTool({
      name: "git_commit",
      description: "Stage files and create a commit.",
      parameters: z.object({
        message: z.string().describe("Commit message"),
        files: z.array(z.string()).default(["."]).describe("Files to stage (default: all)"),
      }),
      execute: async ({ message, files }, context) => {
        try {
          // 1. Stage files
          await execAsync(`git add ${files.join(" ")}`);

          // 2. Commit
          // Escape quotes in message
          const safeMessage = message.replace(/"/g, '\\"');
          const { stdout } = await execAsync(`git commit -m "${safeMessage}"`);

          return { success: true, output: stdout };
        } catch (error) {
          throw new Error(`Git commit failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    }),
  ],
});
