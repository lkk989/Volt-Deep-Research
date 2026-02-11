import {
    createTool,
    createToolkit,
    type Toolkit,
    type Tool,
    type ToolHookOnStartArgs,
    type ToolHookOnEndArgs,
    type ToolExecuteOptions,
} from '@voltagent/core'
import { z } from 'zod'
import { exec } from 'child_process'
import { promisify } from 'util'
import { voltlogger } from '../config/logger.js'

const execAsync = promisify(exec)

export const runTestsTool = createTool({
    name: 'run_tests',
    description: 'Run tests using Vitest.',
    tags: ['test', 'vitest', 'verification'],
    parameters: z.object({
        pattern: z
            .string()
            .optional()
            .describe('Regex pattern to filter test files'),
        watch: z
            .boolean()
            .default(false)
            .describe('Run in watch mode (not recommended for agents)'),
        updateSnapshots: z
            .boolean()
            .default(false)
            .describe('Update snapshots (-u)'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        output: z.string(),
        errorOutput: z.string(),
        message: z.string().optional(),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as {
                pattern?: string
                updateSnapshots: boolean
            }
            voltlogger.info('run_tests: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                pattern: params.pattern,
                updateSnapshots: params.updateSnapshots,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('run_tests: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('run_tests: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: async (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation cancelled')
        }
        const { pattern, updateSnapshots } = args
        try {
            voltlogger.info(
                `Running tests${pattern ? ` matching "${pattern}"` : ''}`,
                { operationId: context?.operationId }
            )

            let cmd = 'npx vitest run'
            if (pattern) {
                cmd += ` ${pattern}`
            }
            if (updateSnapshots) {
                cmd += ' -u'
            }

            const { stdout, stderr } = await execAsync(cmd)

            return {
                success: true,
                output: stdout,
                errorOutput: stderr,
                timestamp: new Date().toISOString(),
            }
        } catch (error: unknown) {
            const isExecError = (
                e: unknown
            ): e is { stdout?: string; stderr?: string } =>
                typeof e === 'object' &&
                e !== null &&
                ('stdout' in e || 'stderr' in e)

            if (isExecError(error)) {
                return {
                    success: false,
                    output: error.stdout ?? '',
                    errorOutput: error.stderr ?? '',
                    message: 'Tests failed',
                    timestamp: new Date().toISOString(),
                }
            }

            return {
                success: false,
                output: '',
                errorOutput: String(error),
                message: 'Tests failed',
                timestamp: new Date().toISOString(),
            }
        }
    },
})

export const testToolkit = createToolkit({
    name: 'test_toolkit',
    description:
        "Tools for running tests using the project's test runner (Vitest).",
    instructions: `
Use these tools to verify code changes:
1. **run_tests**: Run the full test suite or target specific files/patterns.
  `,
    tools: [runTestsTool] as unknown as Tool[],
})
