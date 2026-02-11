import {
    createTool,
    createToolkit,
    type Tool,
    type ToolHookOnStartArgs,
    type ToolHookOnEndArgs,
} from '@voltagent/core'
import type { ToolExecuteOptions } from '@voltagent/core'
import { z } from 'zod'
import { exec } from 'child_process'
import { promisify } from 'util'
import { voltlogger } from '../config/logger.js'

const execAsync = promisify(exec)

const ensureActive = (context?: ToolExecuteOptions) => {
    if (context?.isActive === false) {
        throw new Error('Operation was cancelled')
    }
}

export const gitToolkit = createToolkit({
    name: 'git_toolkit',
    description:
        'Tools for Git version control operations including status, diff, log, and commits.',
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
            name: 'git_status',
            description:
                'Get the current status of the git repository (modified, staged, untracked files).',
            tags: ['git', 'version-control'],
            parameters: z.object({}),
            outputSchema: z.object({
                branch: z.string(),
                clean: z.boolean(),
                files: z.array(
                    z.object({
                        status: z.string(),
                        file: z.string(),
                    })
                ),
            }),
            hooks: {
                onStart: ({ tool, options }: ToolHookOnStartArgs) => {
                    voltlogger.info('git_status: start', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                    })
                },
                onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
                    if (error !== undefined && error !== null) {
                        voltlogger.error('git_status: error', {
                            tool: tool.name,
                            operationId: options?.operationId,
                            toolCallId: options?.toolContext?.callId,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Tool error',
                        })
                        return undefined
                    }
                    voltlogger.info('git_status: end', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                    })
                    return undefined
                },
            },
            execute: async (context?: ToolExecuteOptions) => {
                ensureActive(context)
                try {
                    const { stdout } = await execAsync('git status --porcelain')
                    const { stdout: branchInfo } = await execAsync(
                        'git branch --show-current'
                    )

                    const files = stdout
                        .split('\n')
                        .filter(Boolean)
                        .map((line) => {
                            const status = line.substring(0, 2)
                            const file = line.substring(3)
                            return { status, file }
                        })

                    return {
                        branch: branchInfo.trim(),
                        clean: files.length === 0,
                        files,
                    }
                } catch (error) {
                    throw new Error(
                        `Git status failed: ${error instanceof Error ? error.message : String(error)}`
                    )
                }
            },
        }),
        createTool({
            name: 'git_diff',
            description:
                'Get the diff of changes. Can specify files or check staged/unstaged changes.',
            parameters: z.object({
                files: z
                    .array(z.string())
                    .optional()
                    .describe('Specific files to diff'),
                staged: z
                    .boolean()
                    .default(false)
                    .describe('Show staged changes (git diff --cached)'),
            }),
            tags: ['git', 'version-control', 'diff'],
            outputSchema: z.object({
                diff: z.string(),
            }),
            hooks: {
                onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
                    const params = args as {
                        files?: string[]
                        staged?: boolean
                    }
                    voltlogger.info('git_diff: start', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                        staged: params.staged,
                        fileCount: params.files?.length ?? 0,
                    })
                },
                onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
                    if (error !== undefined && error !== null) {
                        voltlogger.error('git_diff: error', {
                            tool: tool.name,
                            operationId: options?.operationId,
                            toolCallId: options?.toolContext?.callId,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Tool error',
                        })
                        return undefined
                    }
                    voltlogger.info('git_diff: end', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                    })
                    return undefined
                },
            },
            execute: async (
                { files, staged },
                context?: ToolExecuteOptions
            ) => {
                ensureActive(context)
                try {
                    const args = ['diff']
                    if (staged) {
                        args.push('--cached')
                    }
                    if (files && files.length > 0) {
                        args.push('--', ...files)
                    }

                    const { stdout } = await execAsync(`git ${args.join(' ')}`)
                    return { diff: stdout || 'No changes' }
                } catch (error) {
                    throw new Error(
                        `Git diff failed: ${error instanceof Error ? error.message : String(error)}`
                    )
                }
            },
        }),
        createTool({
            name: 'git_log',
            description: 'Get the commit history.',
            tags: ['git', 'version-control', 'log'],
            parameters: z.object({
                maxCount: z
                    .number()
                    .default(10)
                    .describe('Number of commits to show'),
                author: z.string().optional(),
            }),
            outputSchema: z.object({
                commits: z.array(
                    z.object({
                        hash: z.string(),
                        author: z.string(),
                        date: z.string(),
                        message: z.string(),
                    })
                ),
            }),
            hooks: {
                onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
                    const params = args as {
                        maxCount?: number
                        author?: string
                    }
                    voltlogger.info('git_log: start', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                        maxCount: params.maxCount,
                        author: params.author,
                    })
                },
                onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
                    if (error !== undefined && error !== null) {
                        voltlogger.error('git_log: error', {
                            tool: tool.name,
                            operationId: options?.operationId,
                            toolCallId: options?.toolContext?.callId,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Tool error',
                        })
                        return undefined
                    }
                    voltlogger.info('git_log: end', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                    })
                    return undefined
                },
            },
            execute: async (
                { maxCount, author },
                context?: ToolExecuteOptions
            ) => {
                ensureActive(context)
                try {
                    let cmd = `git log -n ${maxCount} --pretty=format:"%h|%an|%ad|%s"`
                    if (typeof author === 'string' && author.length > 0) {
                        cmd += ` --author="${author}"`
                    }

                    const { stdout } = await execAsync(cmd)
                    const commits = stdout
                        .split('\n')
                        .filter(Boolean)
                        .map((line) => {
                            const [hash, commitAuthor, date, message] =
                                line.split('|')
                            return { hash, author: commitAuthor, date, message }
                        })

                    return { commits }
                } catch (error) {
                    throw new Error(
                        `Git log failed: ${error instanceof Error ? error.message : String(error)}`
                    )
                }
            },
        }),
        createTool({
            name: 'git_commit',
            description: 'Stage files and create a commit.',
            tags: ['git', 'version-control', 'commit'],
            parameters: z.object({
                message: z.string().describe('Commit message'),
                files: z
                    .array(z.string())
                    .default(['.'])
                    .describe('Files to stage (default: all)'),
            }),
            outputSchema: z.object({
                success: z.boolean(),
                output: z.string(),
            }),
            hooks: {
                onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
                    const params = args as { message: string; files: string[] }
                    voltlogger.info('git_commit: start', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                        messageLength: params.message.length,
                        fileCount: params.files.length,
                    })
                },
                onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
                    if (error !== undefined && error !== null) {
                        voltlogger.error('git_commit: error', {
                            tool: tool.name,
                            operationId: options?.operationId,
                            toolCallId: options?.toolContext?.callId,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Tool error',
                        })
                        return undefined
                    }
                    voltlogger.info('git_commit: end', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                    })
                    return undefined
                },
            },
            execute: async (
                { message, files },
                context?: ToolExecuteOptions
            ) => {
                ensureActive(context)
                try {
                    // 1. Stage files
                    await execAsync(`git add ${files.join(' ')}`)

                    // 2. Commit
                    // Escape quotes in message
                    const safeMessage = message.replace(/"/g, '\\"')
                    const { stdout } = await execAsync(
                        `git commit -m "${safeMessage}"`
                    )

                    return { success: true, output: stdout }
                } catch (error) {
                    throw new Error(
                        `Git commit failed: ${error instanceof Error ? error.message : String(error)}`
                    )
                }
            },
        }),
        createTool({
            name: 'git_branch_operations',
            description: 'Create, list, or switch branches.',
            tags: ['git', 'version-control', 'branch'],
            parameters: z.object({
                operation: z
                    .enum(['create', 'list', 'switch', 'delete'])
                    .describe('Branch operation to perform'),
                branchName: z
                    .string()
                    .optional()
                    .describe('Name of the branch (required for create, switch, delete)'),
            }),
            outputSchema: z.object({
                success: z.boolean(),
                output: z.string(),
            }),
            hooks: {
                onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
                    const params = args as {
                        operation: string
                        branchName?: string
                    }
                    voltlogger.info('git_branch_operations: start', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                        operation: params.operation,
                        branchName: params.branchName,
                    })
                },
                onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
                    if (error !== undefined && error !== null) {
                        voltlogger.error('git_branch_operations: error', {
                            tool: tool.name,
                            operationId: options?.operationId,
                            toolCallId: options?.toolContext?.callId,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Tool error',
                        })
                        return undefined
                    }
                    voltlogger.info('git_branch_operations: end', {
                        tool: tool.name,
                        operationId: options?.operationId,
                        toolCallId: options?.toolContext?.callId,
                    })
                    return undefined
                },
            },
            execute: async (
                { operation, branchName },
                context?: ToolExecuteOptions
            ) => {
                ensureActive(context)
                try {
                    let cmd = ''
                    switch (operation) {
                        case 'create':
                            if (typeof branchName !== 'string' || branchName.length === 0) {
                                throw new Error(
                                    'branchName is required for create operation'
                                )
                            }
                            cmd = `git branch ${branchName}`
                            break
                        case 'list':
                            cmd = 'git branch -a'
                            break
                        case 'switch':
                            if (typeof branchName !== 'string' || branchName.length === 0) {
                                throw new Error(
                                    'branchName is required for switch operation'
                                )
                            }
                            cmd = `git checkout ${branchName}`
                            break
                        case 'delete':
                            if (typeof branchName !== 'string' || branchName.length === 0) {
                                throw new Error(
                                    'branchName is required for delete operation'
                                )
                            }
                            cmd = `git branch -d ${branchName}`
                            break
                        default:
                            throw new Error(`Unknown operation: ${operation as string}`)
                    }

                    const { stdout } = await execAsync(cmd)
                    return { success: true, output: stdout || 'Operation completed' }
                } catch (error) {
                    throw new Error(
                        `Git branch operation failed: ${error instanceof Error ? error.message : String(error)}`
                    )
                }
            },
        }),
    ] as unknown as Tool[],
})
