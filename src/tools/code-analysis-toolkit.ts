import { createTool, createToolkit, type Toolkit, type ToolExecuteOptions } from "@voltagent/core";
import { z } from "zod";
import * as path from "path";
import { voltlogger } from "../config/logger.js";
import { ProjectCache, PythonParser } from "./semantic-utils.js";
import { SyntaxKind } from "ts-morph";

export const codeAnalysisToolkit: Toolkit = createToolkit({
  name: "code_analysis_toolkit",
  description: "Toolkit for analyzing source code structure, complexity, and symbols. Supports TypeScript and Python.",
  instructions: `
Use these tools to analyze codebases:
1. **analyze_python_code**: specific for Python files to get symbols and complexity.
2. **find_python_references**: find usages of a symbol in Python code.
3. **analyze_typescript_project**: get high-level stats of a TypeScript project.
4. **get_typescript_file_symbols**: get detailed symbols (classes, functions, interfaces) from a specific TypeScript file.
  `,
  tools: [
    createTool({
      name: "analyze_python_code",
      description: "Analyzes Python code to extract symbols (functions, classes, variables) and calculate cyclomatic complexity.",
      parameters: z.object({
        code: z.string().describe("The Python source code to analyze"),
        filePath: z.string().optional().describe("Optional file path for logging context"),
      }),
      execute: async ({ code, filePath }, context?: ToolExecuteOptions) => {
        try {
          voltlogger.info(`Analyzing Python code${filePath ? ` for ${filePath}` : ""}`, {
            operationId: context?.operationId,
          });

          const [symbols, complexity] = await Promise.all([
            PythonParser.findSymbols(code),
            PythonParser.analyzeComplexity(code)
          ]);

          return {
            filePath,
            symbols,
            complexity,
            analyzedAt: new Date().toISOString()
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          voltlogger.error(`Python analysis failed: ${msg}`);
          throw new Error(`Failed to analyze Python code: ${msg}`);
        }
      },
    }),

    createTool({
      name: "find_python_references",
      description: "Finds references/usages of a specific symbol in Python code.",
      parameters: z.object({
        code: z.string().describe("The Python source code to search in"),
        symbolName: z.string().describe("The name of the symbol to find references for"),
      }),
      execute: async ({ code, symbolName }, context?: ToolExecuteOptions) => {
        try {
          const references = await PythonParser.findReferences(code, symbolName);
          return {
            symbolName,
            referenceCount: references.length,
            references
          };
        } catch (error) {
           const msg = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to find Python references: ${msg}`);
        }
      },
    }),

    createTool({
      name: "analyze_typescript_project",
      description: "Initializes a TypeScript project and returns high-level statistics.",
      parameters: z.object({
        projectPath: z.string().describe("Absolute path to the TypeScript project root"),
      }),
      execute: async ({ projectPath }, context?: ToolExecuteOptions) => {
        try {
          voltlogger.info(`Analyzing TS project at ${projectPath}`, { operationId: context?.operationId });

          const cache = ProjectCache.getInstance();
          const project = cache.getOrCreate(projectPath);
          const sourceFiles = project.getSourceFiles();

          return {
            projectPath,
            fileCount: sourceFiles.length,
            compilerOptions: project.getCompilerOptions(),
            sourceFiles: sourceFiles.map(sf => sf.getFilePath()).slice(0, 50), // Limit to first 50 to avoid huge output
            truncated: sourceFiles.length > 50
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to analyze TypeScript project: ${msg}`);
        }
      },
    }),

    createTool({
      name: "get_typescript_file_symbols",
      description: "Extracts classes, interfaces, functions, and other symbols from a TypeScript file.",
      parameters: z.object({
        filePath: z.string().describe("Absolute path to the TypeScript file"),
        projectPath: z.string().optional().describe("Root path of the project (optional, will try to infer or use file dir)"),
      }),
      execute: async ({ filePath, projectPath }, context?: ToolExecuteOptions) => {
        try {
          const rootDir = projectPath || path.dirname(filePath);
          const project = ProjectCache.getInstance().getOrCreate(rootDir);

          const sourceFile = project.getSourceFile(filePath);
          if (!sourceFile) {
            // Try adding it if not found (might be a standalone file or outside configured included paths)
            try {
                project.addSourceFileAtPath(filePath);
            } catch {
                throw new Error(`File ${filePath} not found in project ${rootDir} and could not be added.`);
            }
          }

          const sf = project.getSourceFileOrThrow(filePath);

          const classes = sf.getClasses().map(c => ({
            name: c.getName(),
            isExported: c.isExported(),
            methods: c.getMethods().map(m => m.getName())
          }));

          const interfaces = sf.getInterfaces().map(i => ({
            name: i.getName(),
            isExported: i.isExported(),
            properties: i.getProperties().map(p => p.getName())
          }));

          const functions = sf.getFunctions().map(f => ({
            name: f.getName(),
            isExported: f.isExported(),
            parameters: f.getParameters().map(p => ({ name: p.getName(), type: p.getType().getText() }))
          }));

          const variables = sf.getVariableStatements()
            .flatMap(v => v.getDeclarations())
            .map(d => ({
                name: d.getName(),
                type: d.getType().getText()
            }));

          return {
            filePath,
            classes,
            interfaces,
            functions,
            variables
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to get TypeScript symbols: ${msg}`);
        }
      },
    }),
  ],
});
