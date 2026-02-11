import { AiSdkEmbeddingAdapter, InMemoryVectorAdapter, createTool, createToolkit, type Toolkit } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { voltlogger } from "../../config/logger.js";
import type { WorkspaceRuntime } from "../workspace-runtime.js";

interface IndexedDoc {
    path: string;
    content: string;
    source?: string;
}

type SearchMode = "bm25" | "vector" | "hybrid";

const tokenize = (text: string): string[] =>
    text
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2);

class WorkspaceSearchIndex {
    private docs = new Map<string, IndexedDoc>();
    private df = new Map<string, number>();
    private docLen = new Map<string, number>();
    private avgLen = 0;

    private readonly vector = new InMemoryVectorAdapter();
    private readonly embedding = new AiSdkEmbeddingAdapter(
        google.textEmbedding("gemini-embedding-001")
    );

    public async upsert(doc: IndexedDoc): Promise<void> {
        const tokens = tokenize(doc.content);
        this.docs.set(doc.path, doc);
        this.docLen.set(doc.path, tokens.length);

        const seen = new Set<string>();
        for (const t of tokens) {
            if (seen.has(t)) {
                continue;
            }
            seen.add(t);
            this.df.set(t, (this.df.get(t) ?? 0) + 1);
        }

        const lens = [...this.docLen.values()];
        this.avgLen = lens.length === 0 ? 0 : lens.reduce((total, len) => total + len, 0) / lens.length;

        const vector = await this.embedding.embed(doc.content);
        await this.vector.store(doc.path, vector, { path: doc.path, source: doc.source ?? "filesystem" });
    }

    public list(): IndexedDoc[] {
        return [...this.docs.values()];
    }

    public get(path: string): IndexedDoc | undefined {
        return this.docs.get(path);
    }

    public async search(query: string, options: { mode: SearchMode; topK: number; vectorWeight: number }): Promise<Array<{ path: string; score: number; bm25?: number; vector?: number }>> {
        const tokens = tokenize(query);
        const bm25 = this.searchBm25(tokens);

        if (options.mode === "bm25") {
            return bm25.slice(0, options.topK).map((r) => ({ path: r.path, score: r.score, bm25: r.score }));
        }

        const vectorResults = await this.searchVector(query, options.topK);
        if (options.mode === "vector") {
            return vectorResults.map((r) => ({ path: r.path, score: r.score, vector: r.score }));
        }

        const combined = new Map<string, { bm25?: number; vector?: number }>();
        for (const r of bm25.slice(0, options.topK * 3)) {
            combined.set(r.path, { ...(combined.get(r.path) ?? {}), bm25: r.score });
        }
        for (const r of vectorResults) {
            combined.set(r.path, { ...(combined.get(r.path) ?? {}), vector: r.score });
        }

        const results = [...combined.entries()].map(([path, parts]) => {
            const bw = parts.bm25 ?? 0;
            const vw = parts.vector ?? 0;
            const score = options.vectorWeight * vw + (1 - options.vectorWeight) * bw;
            return { path, score, bm25: parts.bm25, vector: parts.vector };
        });
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, options.topK);
    }

    private searchBm25(queryTokens: string[]): Array<{ path: string; score: number }> {
        const N = this.docs.size;
        if (N === 0 || queryTokens.length === 0) {
            return [];
        }
        const k1 = 1.2;
        const bm25B = 0.75;

        const results: Array<{ path: string; score: number }> = [];
        for (const doc of this.docs.values()) {
            const docTokens = tokenize(doc.content);
            const tf = new Map<string, number>();
            for (const t of docTokens) {
                tf.set(t, (tf.get(t) ?? 0) + 1);
            }
            const dl = docTokens.length;
            let score = 0;
            for (const q of queryTokens) {
                const f = tf.get(q) ?? 0;
                if (f === 0) {
                    continue;
                }
                const df = this.df.get(q) ?? 0;
                const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
                const denom = f + k1 * (1 - bm25B + (bm25B * dl) / (this.avgLen || 1));
                score += idf * ((f * (k1 + 1)) / denom);
            }
            if (score > 0) {
                results.push({ path: doc.path, score });
            }
        }

        results.sort((a, b) => b.score - a.score);
        return normalizeScores(results);
    }

    private async searchVector(query: string, topK: number): Promise<Array<{ path: string; score: number }>> {
        const qv = await this.embedding.embed(query);
        const hits = await this.vector.search(qv, { limit: topK });
        const results = hits.map((h) => ({ path: String(h.id), score: h.score }));
        return normalizeScores(results);
    }
}

const normalizeScores = <T extends { score: number }>(results: T[]): T[] => {
    if (results.length === 0) {
        return results;
    }
    const max = Math.max(...results.map((r) => r.score));
    const min = Math.min(...results.map((r) => r.score));
    const range = max - min;
    if (range <= 0) {
        return results.map((r) => ({ ...r, score: 1 }));
    }
    return results.map((r) => ({ ...r, score: (r.score - min) / range }));
};

const snippet = (content: string, query: string, maxLen: number): { snippet: string; lineRange?: [number, number] } => {
    const lines = content.split(/\r?\n/);
    const q = query.trim().toLowerCase();
    let bestLine = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(q)) {
            bestLine = i;
            break;
        }
    }
    const start = Math.max(0, bestLine - 2);
    const end = Math.min(lines.length - 1, bestLine + 2);
    const combined = lines.slice(start, end + 1).join("\n");
    const s = combined.length > maxLen ? combined.slice(0, maxLen) + "\n..." : combined;
    return { snippet: s, lineRange: [start + 1, end + 1] };
};

export const createWorkspaceSearchToolkit = (workspace: WorkspaceRuntime): Toolkit => {
    const index = new WorkspaceSearchIndex();
    const policy = (toolName: string) => workspace.getPolicy("search", toolName);

    const indexTool = createTool({
        name: "workspace_index",
        description: "Index workspace filesystem files under a path (optionally filtered by glob).",
        needsApproval: policy("workspace_index").needsApproval,
        parameters: z.object({
            path: z.string().describe("Workspace directory path starting with /") ,
            glob: z.string().optional().default("**/*").describe("Glob filter"),
            max_files: z.number().int().positive().optional().default(200),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const fsToolkitBackend = workspace.getFilesystemBackend();
            const matches = await fsToolkitBackend.globInfo(args.glob, args.path);
            const files = matches.filter((m) => !(m.is_dir ?? false)).slice(0, args.max_files);

            let indexed = 0;
            for (const file of files) {
                const content = await fsToolkitBackend.read(file.path);
                await index.upsert({ path: file.path, content, source: "filesystem" });
                indexed++;
            }
            voltlogger.info("Workspace search indexed files", { indexed });
            return { indexed, totalFound: matches.length };
        },
    });

    const indexContentTool = createTool({
        name: "workspace_index_content",
        description: "Index raw content under a virtual path for later search.",
        needsApproval: policy("workspace_index_content").needsApproval,
        parameters: z.object({
            path: z.string().describe("Virtual path to store content under"),
            content: z.string().describe("Raw content"),
            source: z.string().optional().default("manual"),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const p = workspace.normalizeWorkspacePath(args.path);
            await index.upsert({ path: p, content: args.content, source: args.source });
            return { indexed: true, path: p };
        },
    });

    const searchTool = createTool({
        name: "workspace_search",
        description: "Search indexed workspace content using BM25, vector, or hybrid search.",
        needsApproval: policy("workspace_search").needsApproval,
        parameters: z.object({
            query: z.string().min(1),
            mode: z.enum(["bm25", "vector", "hybrid"]).optional().default("hybrid"),
            top_k: z.number().int().positive().optional().default(5),
            min_score: z.number().min(0).max(1).optional().default(0),
            include_content: z.boolean().optional().default(true),
            snippet_length: z.number().int().positive().optional().default(200),
            vector_weight: z.number().min(0).max(1).optional().default(0.6),
        }),
        execute: async (args, execOptions) => {
            if (execOptions?.isActive === false) {
                throw new Error("Operation has been cancelled");
            }
            const results = await index.search(args.query, {
                mode: args.mode,
                topK: args.top_k,
                vectorWeight: args.vector_weight,
            });

            const filtered = results.filter((r) => r.score >= args.min_score);
            return {
                query: args.query,
                results: filtered.map((r) => {
                    const doc = index.get(r.path);
                    const content = doc?.content ?? "";
                    const snippetData = snippet(content, args.query, args.snippet_length);
                    return {
                        path: r.path,
                        score: r.score,
                        scoreDetails: {
                            bm25: r.bm25,
                            vector: r.vector,
                        },
                        content: args.include_content ? content : undefined,
                        snippet: snippetData.snippet,
                        lineRange: snippetData.lineRange,
                    };
                }),
            };
        },
    });

    return createToolkit({
        name: "workspace_search",
        description: "Index + search over workspace filesystem content.",
        instructions:
            "Use workspace_index before searching filesystem content. Use snippet-only output to keep token usage low.",
        addInstructions: true,
        tools: [indexTool, indexContentTool, searchTool],
    });
};
