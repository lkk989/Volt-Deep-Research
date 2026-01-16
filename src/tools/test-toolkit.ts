import { createTool, createToolkit, type Toolkit } from "@voltagent/core";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { voltlogger } from "../config/logger.js";
import * as path from "path";

const execAsync = promisify(exec);

export const testToolkit = createToolkit({
  name: "test_toolkit",
  description: "Tools for running tests using the project's test runner (Vitest).",
  instructions: `
Use these tools to verify code changes:
1. **run_tests**: Run the full test suite or target specific files/patterns.
2. **run_coverage**: Check test coverage.
  `,
  tools: [
    createTool({
      name: "run_tests",
      description: "Run tests using Vitest.",
      parameters: z.object({
        pattern: z.string().optional().describe("Regex pattern to filter test files"),
        watch: z.boolean().default(false).describe("Run in watch mode (not recommended for agents)"),
        updateSnapshots: z.boolean().default(false).describe("Update snapshots (-u)"),
      }),
      execute: async ({ pattern, updateSnapshots }, context) => {
        try {
          voltlogger.info(`Running tests${pattern ? ` matching "${pattern}"` : ""}`, { operationId: context?.operationId });

          let cmd = "npx vitest run";
          if (pattern) cmd += ` ${pattern}`;
          if (updateSnapshots) cmd += " -u";
          // Add reporter for machine-readable output if needed, but text is fine for LLMs
          
          const { stdout, stderr } = await execAsync(cmd);
          
          return {
            success: true,
            output: stdout,
            errorOutput: stderr
          };
        } catch (error: any) {
          // Vitest returns exit code 1 on failure, which throws in execAsync
          return {
            success: false,
            output: error.stdout,
            errorOutput: error.stderr,
            message: "Tests failed"
          };
        }
      },
    }),
  ],
});
