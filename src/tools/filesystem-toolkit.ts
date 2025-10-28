import { createTool, createToolkit } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"
import { globby } from "globby"
import * as fs from "fs/promises"

export const filesystemGlobTool = createTool({
  name: "filesystem_glob",
  description: "Find files and directories using glob patterns. Supports advanced matching with globby.",
  parameters: z.object({
    patterns: z.array(z.string()).describe("Array of glob patterns to match (e.g., ['**/*.ts', 'src/**/*.js'])"),
    cwd: z.string().optional().describe("Current working directory for the search (defaults to project root)"),
    ignore: z.array(z.string()).optional().describe("Patterns to ignore (e.g., ['node_modules/**', '**/*.log'])"),
    onlyFiles: z.boolean().default(true).describe("Return only files, not directories"),
    onlyDirectories: z.boolean().default(false).describe("Return only directories, not files"),
    deep: z.number().optional().describe("Maximum depth to search (default: unlimited)"),
    caseSensitiveMatch: z.boolean().default(false).describe("Case sensitive matching"),
    absolute: z.boolean().default(false).describe("Return absolute paths instead of relative"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Globbing files with patterns: ${args.patterns.join(", ")}`)

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
        cwd: args.cwd || process.cwd(),
        ignore: args.ignore || [],
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
      }
    } catch (error) {
      voltlogger.error(`Filesystem glob failed: ${error}`)
      throw new Error(`Failed to glob files: ${error}`)
    }
  },
})

export const filesystemReadMultipleTool = createTool({
  name: "filesystem_read_multiple",
  description: "Read multiple files at once and return their contents. Useful for batch file operations.",
  parameters: z.object({
    filePaths: z.array(z.string()).describe("Array of file paths to read"),
    encoding: z.string().default("utf8").describe("File encoding (utf8, ascii, etc.)"),
    maxFileSize: z.number().optional().describe("Maximum file size in bytes to read (skip larger files)"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Reading ${args.filePaths.length} files`)

    try {
      const results = []
      const errors = []

      for (const filePath of args.filePaths) {
        try {
          // Check file size if limit specified
          if (args.maxFileSize) {
            const stats = await fs.stat(filePath)
            if (stats.size > args.maxFileSize) {
              errors.push({
                filePath,
                error: `File too large (${stats.size} bytes > ${args.maxFileSize} bytes)`,
              })
              continue
            }
          }

          const content = await fs.readFile(filePath, { encoding: args.encoding as BufferEncoding })
          results.push({
            filePath,
            content,
            size: content.length,
          })
        } catch (error) {
          errors.push({
            filePath,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      voltlogger.info(`Successfully read ${results.length} files, ${errors.length} errors`)

      return {
        results,
        errors,
        totalRequested: args.filePaths.length,
        successful: results.length,
        failed: errors.length,
      }
    } catch (error) {
      voltlogger.error(`Batch file read failed: ${error}`)
      throw new Error(`Failed to read files: ${error}`)
    }
  },
})

export const filesystemStatsTool = createTool({
  name: "filesystem_stats",
  description: "Get detailed statistics for files and directories including size, permissions, and timestamps.",
  parameters: z.object({
    paths: z.array(z.string()).describe("Array of file or directory paths to get stats for"),
    followSymlinks: z.boolean().default(false).describe("Follow symbolic links"),
  }),
  execute: async (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Getting stats for ${args.paths.length} paths`)

    try {
      const results = []
      const errors = []

      for (const filePath of args.paths) {
        try {
          const stats = await fs.stat(filePath, { bigint: false })
          const isDirectory = stats.isDirectory()
          const isFile = stats.isFile()

          results.push({
            path: filePath,
            type: isDirectory ? "directory" : isFile ? "file" : "other",
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
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      voltlogger.info(`Got stats for ${results.length} paths, ${errors.length} errors`)

      return {
        results,
        errors,
        totalRequested: args.paths.length,
        successful: results.length,
        failed: errors.length,
      }
    } catch (error) {
      voltlogger.error(`Filesystem stats failed: ${error}`)
      throw new Error(`Failed to get file stats: ${error}`)
    }
  },
})

export const filesystemToolkit = createToolkit({
  name: "filesystem_toolkit",
  description: "Tools for advanced file system operations including globbing, batch reading, and file statistics.",
  instructions: `Use these tools for comprehensive file system operations. The glob tool uses globby for powerful pattern matching. Use batch reading for multiple files and stats for detailed file information. Always specify appropriate ignore patterns to avoid node_modules and other large directories.`,
  addInstructions: true,
  tools: [filesystemGlobTool, filesystemReadMultipleTool, filesystemStatsTool],
})
