import { Project } from 'ts-morph';
import * as path from 'node:path';
import { exec, spawn } from 'child_process';
import fg from 'fast-glob';
import { promisify } from 'util';
import { writeFile, unlink } from 'node:fs/promises';
import { existsSync, unlinkSync } from 'node:fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { voltlogger } from '../config/logger.js';

// ==========================================
// ProjectCache Implementation
// ==========================================

interface CachedProject {
  project: Project;
  lastAccess: number;
  fileCount: number;
  estimatedMemoryMB: number;
  hitCount: number;
  projectPath: string;
}

interface CacheStats {
  size: number;
  totalMemoryMB: number;
  hitRate: number;
  projects: Array<{
    path: string;
    files: number;
    memoryMB: number;
    age: number;
    hits: number;
  }>;
}

export class ProjectCache {
  private static instance: ProjectCache | null = null;
  private cache = new Map<string, CachedProject>();
  private totalHits = 0;
  private totalMisses = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly MAX_PROJECT_MEMORY_MB = 2048; // 2GB limit per project
  private readonly MAX_TOTAL_MEMORY_MB = 4096;   // 4GB total cache limit
  private readonly MEMORY_PER_FILE_MB = 0.5;     // Rough estimate
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): ProjectCache {
    ProjectCache.instance ??= new ProjectCache();
    return ProjectCache.instance;
  }

  public getOrCreate(projectPath: string): Project {
    const normalizedPath = path.normalize(projectPath);
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(normalizedPath);
    if (cached) {
      this.totalHits++;
      cached.hitCount++;
      cached.lastAccess = now;
      return cached.project;
    }

    this.totalMisses++;

    // Create new project with better error handling
    try {
      voltlogger.info(`Initializing new ts-morph project for ${normalizedPath}`);

      const tsConfigPath = path.join(normalizedPath, 'tsconfig.json');
      const hasTsConfig = existsSync(tsConfigPath);

      const project = new Project({
        tsConfigFilePath: hasTsConfig ? tsConfigPath : undefined,
        skipAddingFilesFromTsConfig: false,
        skipFileDependencyResolution: true, // Better performance
        skipLoadingLibFiles: true, // Skip loading lib files for better performance
      });

      // Add source files manually if no tsconfig
      if (!hasTsConfig) {
        const sourceFiles = fg.sync('**/*.{ts,tsx,js,jsx}', {
          cwd: normalizedPath,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
          onlyFiles: true,
          absolute: true,
          dot: true,
          unique: true,
        });
        project.addSourceFilesAtPaths(sourceFiles);
      }

      // Estimate memory usage
      const fileCount = project.getSourceFiles().length;
      const estimatedMemoryMB = Math.max(fileCount * this.MEMORY_PER_FILE_MB, 10); // Minimum 10MB

      // Cache if within limits
      if (estimatedMemoryMB <= this.MAX_PROJECT_MEMORY_MB) {
        // Evict if needed
        this.ensureCapacity(estimatedMemoryMB);

        this.cache.set(normalizedPath, {
          project,
          lastAccess: now,
          fileCount,
          estimatedMemoryMB,
          hitCount: 0,
          projectPath: normalizedPath
        });

        voltlogger.info(`Cached project ${normalizedPath}: ${fileCount} files, ~${estimatedMemoryMB.toFixed(1)}MB`);
      } else {
        voltlogger.warn(`Project ${normalizedPath} too large (${estimatedMemoryMB.toFixed(1)}MB) - skipping cache`);
      }

      return project;
    } catch (error) {
      voltlogger.error(`Failed to create project for ${normalizedPath}`, { error });
      throw new Error(`Failed to initialize TypeScript project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private ensureCapacity(requiredMB: number): void {
    let currentUsage = this.getTotalMemoryUsage();

    if (currentUsage + requiredMB <= this.MAX_TOTAL_MEMORY_MB) {
      return;
    }

    // Evict LRU items
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      currentUsage -= entry.estimatedMemoryMB;
      voltlogger.info(`Evicted project ${key} from cache`);
      if (currentUsage + requiredMB <= this.MAX_TOTAL_MEMORY_MB) {
        break;
      }
    }
  }

  private getTotalMemoryUsage(): number {
    let total = 0;
    this.cache.forEach(entry => total += entry.estimatedMemoryMB);
    return total;
  }

  public getStats(): CacheStats {
    const now = Date.now();
    const totalRequests = this.totalHits + this.totalMisses;
    const hitRate = totalRequests > 0 ? this.totalHits / totalRequests : 0;

    return {
      size: this.cache.size,
      totalMemoryMB: this.getTotalMemoryUsage(),
      hitRate,
      projects: Array.from(this.cache.values()).map(entry => ({
        path: entry.projectPath,
        files: entry.fileCount,
        memoryMB: entry.estimatedMemoryMB,
        age: now - entry.lastAccess,
        hits: entry.hitCount
      }))
    };
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, this.CLEANUP_INTERVAL_MS);

    this.cleanupInterval.unref();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccess > this.CACHE_TTL_MS) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      voltlogger.info(`Cleaned up expired project ${key} from cache`);
    });
  }

  public clear(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }
}

// ==========================================
// PythonParser Implementation
// ==========================================

const execAsync = promisify(exec);

const EXEC_CONFIG = {
  maxBuffer: 10 * 1024 * 1024, // 10MB
  timeout: 30000 // 30 seconds
} as const;

interface CacheEntry {
  result: PythonResult;
  timestamp: number;
}

interface PythonResult {
  success: boolean;
  symbols?: PythonSymbol[];
  cyclomaticComplexity?: number;
  functions?: Array<{
    name: string;
    complexity: number;
    line: number;
  }>;
  classes?: Array<{
    name: string;
    methods: number;
    line: number;
  }>;
  references?: Array<{
    name: string;
    kind: string;
    line: number;
    column: number;
    isDefinition: boolean;
    text: string;
  }>;
  error?: string;
}

const RESULT_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 1 minute
const MAX_CACHE_SIZE = 50;

export interface PythonSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'import';
  line: number;
  column: number;
  endLine?: number;
  docstring?: string;
}

export interface PythonComplexity {
  cyclomaticComplexity: number;
  functions: Array<{
    name: string;
    complexity: number;
    line: number;
  }>;
  classes: Array<{
    name: string;
    methods: number;
    line: number;
  }>;
}

export class PythonParser {
  private static cleanupRegistered = false;

  private static pythonScript = `
import ast
import sys
import json

def analyze_code(code):
    try:
        tree = ast.parse(code)
        symbols = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                symbols.append({
                    'name': node.name,
                    'kind': 'function',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'endLine': node.end_lineno,
                    'docstring': ast.get_docstring(node)
                })
            elif isinstance(node, ast.ClassDef):
                symbols.append({
                    'name': node.name,
                    'kind': 'class',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'endLine': node.end_lineno,
                    'docstring': ast.get_docstring(node)
                })
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        symbols.append({
                            'name': target.id,
                            'kind': 'variable',
                            'line': node.lineno,
                            'column': node.col_offset
                        })
            elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    symbols.append({
                        'name': alias.name,
                        'kind': 'import',
                        'line': node.lineno,
                        'column': node.col_offset
                    })

        return {'success': True, 'symbols': symbols}
    except SyntaxError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def calculate_complexity(code):
    try:
        tree = ast.parse(code)

        def cyclomatic_complexity(node):
            complexity = 1
            for child in ast.walk(node):
                if isinstance(child, (ast.If, ast.For, ast.While, ast.And, ast.Or, ast.ExceptHandler)):
                    complexity += 1
                elif isinstance(child, ast.BoolOp):
                    complexity += len(child.values) - 1
            return complexity

        functions = []
        classes = []
        total_complexity = 1

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_complexity = cyclomatic_complexity(node)
                functions.append({
                    'name': node.name,
                    'complexity': func_complexity,
                    'line': node.lineno
                })
                total_complexity += func_complexity
            elif isinstance(node, ast.ClassDef):
                method_count = sum(1 for n in node.body if isinstance(n, ast.FunctionDef))
                classes.append({
                    'name': node.name,
                    'methods': method_count,
                    'line': node.lineno
                })

        return {
            'success': True,
            'cyclomaticComplexity': total_complexity,
            'functions': functions,
            'classes': classes
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def find_references(code, symbol_name):
    try:
        tree = ast.parse(code)
        references = []
        lines = code.splitlines()

        def get_line_content(lineno):
            if 0 <= lineno - 1 < len(lines):
                return lines[lineno - 1].strip()
            return ''

        for node in ast.walk(tree):
            match = False
            is_def = False
            kind = 'usage'
            lineno = getattr(node, 'lineno', 0)
            col_offset = getattr(node, 'col_offset', 0)

            if isinstance(node, ast.FunctionDef) and node.name == symbol_name:
                match = True
                is_def = True
                kind = 'function'
            elif isinstance(node, ast.ClassDef) and node.name == symbol_name:
                match = True
                is_def = True
                kind = 'class'
            elif isinstance(node, ast.Name) and node.id == symbol_name:
                match = True
                if isinstance(node.ctx, ast.Store):
                    is_def = True
                    kind = 'variable'
                else:
                    is_def = False
                    kind = 'usage'
            elif isinstance(node, ast.Attribute) and node.attr == symbol_name:
                match = True
                is_def = False
                kind = 'usage'
            elif isinstance(node, ast.arg) and node.arg == symbol_name:
                match = True
                is_def = True
                kind = 'parameter'
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                for alias in node.names:
                    if alias.name == symbol_name or alias.asname == symbol_name:
                        match = True
                        is_def = True
                        kind = 'import'
                        break
            
            if match and lineno > 0:
                references.append({
                    'name': symbol_name,
                    'kind': kind,
                    'line': lineno,
                    'column': col_offset,
                    'isDefinition': is_def,
                    'text': get_line_content(lineno)
                })

        return {'success': True, 'references': references}
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    code = sys.stdin.read()
    action = sys.argv[1] if len(sys.argv) > 1 else 'symbols'

    if action == 'symbols':
        result = analyze_code(code)
    elif action == 'complexity':
        result = calculate_complexity(code)
    elif action == 'references':
        symbol_name = sys.argv[2] if len(sys.argv) > 2 else ''
        result = find_references(code, symbol_name)
    else:
        result = {'success': False, 'error': 'Unknown action'}

    print(json.dumps(result))
`;

  private static scriptPath: string | null = null;
  private static pythonCommand: string | null = null;

  private static async getPythonCommand(): Promise<string> {
    if (this.pythonCommand !== null) {
      return this.pythonCommand;
    }

    const commands = ['python3', 'python'];
    for (const cmd of commands) {
      try {
        await execAsync(`${cmd} --version`, { timeout: 5000 });
        this.pythonCommand = cmd;
        return cmd;
      } catch {
        continue;
      }
    }
    throw new Error('Python 3 not found. Please install Python 3 to analyze Python code.');
  }

  private static getCacheKey(code: string, action: string): string {
    const hash = crypto.createHash('md5').update(code).digest('hex');
    return `${action}:${hash}`;
  }

  private static getCachedResult(key: string): PythonResult | null {
    const entry = RESULT_CACHE.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.result;
    }
    if (entry) {
      RESULT_CACHE.delete(key);
    }
    return null;
  }

  private static cacheResult(key: string, result: PythonResult): void {
    if (RESULT_CACHE.size >= MAX_CACHE_SIZE) {
      const oldestKey = RESULT_CACHE.keys().next().value;
      if (oldestKey !== undefined) {
        RESULT_CACHE.delete(oldestKey);
      }
    }
    RESULT_CACHE.set(key, { result, timestamp: Date.now() });
  }

  private static registerCleanup(): void {
    if (this.cleanupRegistered) {
      return;
    }

    this.cleanupRegistered = true;

    process.on('exit', () => {
      if (this.scriptPath !== null) {
        try {
          unlinkSync(this.scriptPath);
        } catch {
          // Ignore errors
        }
      }
    });
  }

  private static async ensureScriptExists(): Promise<string> {
    if (this.scriptPath !== null) {
      return this.scriptPath;
    }

    this.registerCleanup();

    this.scriptPath = path.join(os.tmpdir(), `mastra-python-parser-${process.pid}.py`);
    await writeFile(this.scriptPath, this.pythonScript);
    return this.scriptPath;
  }

  private static async executePython(code: string, action: string, args: string[] = []): Promise<PythonResult> {
    const cacheKey = this.getCacheKey(code, action + args.join(','));
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const pythonCmd = await this.getPythonCommand();
      const scriptPath = await this.ensureScriptExists();

      const result = await new Promise<PythonResult>((resolve, reject) => {
        const child = spawn(pythonCmd, [scriptPath, action, ...args], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data: Buffer | string) => {
          stdout += typeof data === 'string' ? data : data.toString('utf8');
        });

        child.stderr.on('data', (data: Buffer | string) => {
          stderr += typeof data === 'string' ? data : data.toString('utf8');
        });

        child.on('close', () => {
          if (stderr && !stderr.includes('DeprecationWarning')) {
            voltlogger.warn('Python stderr:', { stderr });
          }

          try {
            const parsed = JSON.parse(stdout) as PythonResult;
            if (!parsed.success) {
              reject(new Error(parsed.error ?? `Python ${action} analysis failed`));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error(`Failed to parse Python output: ${stdout.substring(0, 200)}`));
          }
        });

        child.on('error', (error) => {
          reject(error);
        });

        const timeout = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error('Python execution timed out'));
        }, EXEC_CONFIG.timeout);

        child.on('close', () => clearTimeout(timeout));

        child.stdin.write(code);
        child.stdin.end();
      });

      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new Error('Python 3 not found. Please install Python 3 to analyze Python code.');
      }
      throw error;
    }
  }

  public static async findSymbols(code: string): Promise<PythonSymbol[]> {
    const result = await this.executePython(code, 'symbols');
    return result.symbols ?? [];
  }

  public static async analyzeComplexity(code: string): Promise<PythonComplexity> {
    const result = await this.executePython(code, 'complexity');
    return {
      cyclomaticComplexity: result.cyclomaticComplexity ?? 1,
      functions: result.functions ?? [],
      classes: result.classes ?? []
    };
  }

  public static async findReferences(code: string, symbolName: string): Promise<Array<{
    name: string;
    kind: string;
    line: number;
    column: number;
    isDefinition: boolean;
    text: string;
  }>> {
    const result = await this.executePython(code, 'references', [symbolName]);
    return result.references ?? [];
  }

  public static async cleanup(): Promise<void> {
    if (this.scriptPath !== null) {
      await unlink(this.scriptPath).catch(() => {});
      this.scriptPath = null;
    }
    RESULT_CACHE.clear();
    this.pythonCommand = null;
  }

  public static isPythonFile(filePath: string): boolean {
    return filePath.endsWith('.py');
  }
}
