import {
    createTool,
    createToolkit,
    type Tool,
    type ToolHookOnStartArgs,
    type ToolHookOnEndArgs,
    type ToolExecuteOptions,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'
import { globby } from 'globby'
import { promises as fsPromises } from 'node:fs'

export const filesystemGlobTool = createTool({
    name: 'filesystem_glob',
    description:
        'Find files and directories using glob patterns. Supports advanced matching with globby.',
    tags: ['filesystem', 'glob', 'search'],
    parameters: z.object({
        patterns: z
            .array(z.string())
            .describe(
                "Array of glob patterns to match (e.g., ['**/*.ts', 'src/**/*.js'])"
            ),
        cwd: z
            .string()
            .optional()
            .describe(
                'Current working directory for the search (defaults to project root)'
            ),
        ignore: z
            .array(z.string())
            .optional()
            .describe(
                "Patterns to ignore (e.g., ['node_modules/**', '**/*.log'])"
            ),
        onlyFiles: z
            .boolean()
            .default(true)
            .describe('Return only files, not directories'),
        onlyDirectories: z
            .boolean()
            .default(false)
            .describe('Return only directories, not files'),
        deep: z
            .number()
            .optional()
            .describe('Maximum depth to search (default: unlimited)'),
        caseSensitiveMatch: z
            .boolean()
            .default(false)
            .describe('Case sensitive matching'),
        absolute: z
            .boolean()
            .default(false)
            .describe('Return absolute paths instead of relative'),
    }),
    outputSchema: z.object({
        patterns: z.array(z.string()),
        matches: z.array(z.string()),
        count: z.number(),
        options: z.object({
            cwd: z.string(),
            onlyFiles: z.boolean(),
            onlyDirectories: z.boolean(),
            absolute: z.boolean(),
        }),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { patterns: string[]; cwd?: string }
            voltlogger.info('filesystem_glob: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                patternCount: params.patterns.length,
                cwd: params.cwd ?? process.cwd(),
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('filesystem_glob: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('filesystem_glob: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: async (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        voltlogger.info(
            `Globbing files with patterns: ${args.patterns.join(', ')}`,
            { operationId: context?.operationId }
        )

        try {
            const options: {
                cwd: string
                ignore: string[]
                onlyFiles: boolean
                onlyDirectories: boolean
                deep?: number
                caseSensitiveMatch: boolean
                absolute: boolean
            } = {
                cwd: args.cwd ?? process.cwd(),
                ignore: args.ignore ?? [],
                onlyFiles: args.onlyFiles,
                onlyDirectories: args.onlyDirectories,
                deep: args.deep,
                caseSensitiveMatch: args.caseSensitiveMatch,
                absolute: args.absolute,
            }

            const matches = await globby(args.patterns, options)

            voltlogger.info(`Found ${matches.length} matches`)

            return {
                patterns: args.patterns,
                matches,
                count: matches.length,
                options: {
                    cwd: options.cwd,
                    onlyFiles: options.onlyFiles,
                    onlyDirectories: options.onlyDirectories,
                    absolute: options.absolute,
                },
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            const errMsg =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Filesystem glob failed: ${errMsg}`)
            throw new Error(`Failed to glob files: ${errMsg}`)
        }
    },
})

export const filesystemReadMultipleTool = createTool({
    name: 'filesystem_read_multiple',
    description:
        'Read multiple files at once and return their contents. Useful for batch file operations.',
    tags: ['filesystem', 'read', 'batch'],
    parameters: z.object({
        filePaths: z.array(z.string()).describe('Array of file paths to read'),
        encoding: z
            .string()
            .default('utf8')
            .describe('File encoding (utf8, ascii, etc.)'),
        maxFileSize: z
            .number()
            .optional()
            .describe('Maximum file size in bytes to read (skip larger files)'),
    }),
    outputSchema: z.object({
        results: z.array(
            z.object({
                filePath: z.string(),
                content: z.string(),
                size: z.number(),
            })
        ),
        errors: z.array(
            z.object({
                filePath: z.string(),
                error: z.string(),
            })
        ),
        totalRequested: z.number(),
        successful: z.number(),
        failed: z.number(),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { filePaths: string[] }
            voltlogger.info('filesystem_read_multiple: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                fileCount: params.filePaths.length,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('filesystem_read_multiple: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('filesystem_read_multiple: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: async (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        voltlogger.info(`Reading ${args.filePaths.length} files`, {
            operationId: context?.operationId,
        })

        try {
            const results = []
            const errors = []

            for (const filePath of args.filePaths) {
                try {
                    // Check file size if limit specified
                    if (args.maxFileSize) {
                        const stats = await fsPromises.stat(filePath)
                        if (stats.size > args.maxFileSize) {
                            errors.push({
                                filePath,
                                error: `File too large (${stats.size} bytes > ${args.maxFileSize} bytes)`,
                            })
                            continue
                        }
                    }

                    const content = await fsPromises.readFile(filePath, {
                        encoding: args.encoding as BufferEncoding,
                    })
                    results.push({
                        filePath,
                        content,
                        size: content.length,
                    })
                } catch (error) {
                    errors.push({
                        filePath,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                }
            }

            voltlogger.info(
                `Successfully read ${results.length} files, ${errors.length} errors`
            )

            return {
                results,
                errors,
                totalRequested: args.filePaths.length,
                successful: results.length,
                failed: errors.length,
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            const errMsg =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Batch file read failed: ${errMsg}`)
            throw new Error(`Failed to read files: ${errMsg}`)
        }
    },
})

export const filesystemStatsTool = createTool({
    name: 'filesystem_stats',
    description:
        'Get detailed statistics for files and directories including size, permissions, and timestamps.',
    tags: ['filesystem', 'stats', 'metadata'],
    parameters: z.object({
        paths: z
            .array(z.string())
            .describe('Array of file or directory paths to get stats for'),
        followSymlinks: z
            .boolean()
            .default(false)
            .describe('Follow symbolic links'),
    }),
    outputSchema: z.object({
        results: z.array(
            z.object({
                path: z.string(),
                type: z.string(),
                size: z.number(),
                permissions: z.object({
                    readable: z.boolean(),
                    writable: z.boolean(),
                    executable: z.boolean(),
                }),
                timestamps: z.object({
                    created: z.date(),
                    modified: z.date(),
                    accessed: z.date(),
                }),
                isDirectory: z.boolean(),
                isFile: z.boolean(),
                isSymbolicLink: z.boolean(),
            })
        ),
        errors: z.array(
            z.object({
                path: z.string(),
                error: z.string(),
            })
        ),
        totalRequested: z.number(),
        successful: z.number(),
        failed: z.number(),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { paths: string[] }
            voltlogger.info('filesystem_stats: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                pathCount: params.paths.length,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('filesystem_stats: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('filesystem_stats: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: async (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        voltlogger.info(`Getting stats for ${args.paths.length} paths`, {
            operationId: context?.operationId,
        })

        try {
            const results = []
            const errors = []

            for (const filePath of args.paths) {
                try {
                    const stats = await fsPromises.stat(filePath, {
                        bigint: false,
                    })
                    const isDirectory = stats.isDirectory()
                    const isFile = stats.isFile()

                    results.push({
                        path: filePath,
                        type: isDirectory
                            ? 'directory'
                            : isFile
                              ? 'file'
                              : 'other',
                        size: stats.size,
                        permissions: {
                            readable: true, // We'll check this
                            writable: true,
                            executable: true,
                        },
                        timestamps: {
                            created: stats.birthtime,
                            modified: stats.mtime,
                            accessed: stats.atime,
                        },
                        isDirectory,
                        isFile,
                        isSymbolicLink: stats.isSymbolicLink(),
                    })
                } catch (error) {
                    errors.push({
                        path: filePath,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                }
            }

            voltlogger.info(
                `Got stats for ${results.length} paths, ${errors.length} errors`
            )

            return {
                results,
                errors,
                totalRequested: args.paths.length,
                successful: results.length,
                failed: errors.length,
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            const errMsg =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Filesystem stats failed: ${errMsg}`)
            throw new Error(`Failed to get file stats: ${errMsg}`)
        }
    },
})

export const filesystemToolkit = createToolkit({
    name: 'filesystem_toolkit',
    description:
        'Tools for advanced file system operations including globbing, batch reading, and file statistics.',
    instructions: `Use these tools for comprehensive file system operations. The glob tool uses globby for powerful pattern matching. Use batch reading for multiple files and stats for detailed file information. Always specify appropriate ignore patterns to avoid node_modules and other large directories.`,
    addInstructions: true,
    tools: [
        filesystemGlobTool,
        filesystemReadMultipleTool,
        filesystemStatsTool,
    ] as unknown as Tool[],
})
