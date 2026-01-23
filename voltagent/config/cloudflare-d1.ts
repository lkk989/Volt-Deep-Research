import { D1MemoryAdapter } from "@voltagent/cloudflare-d1";
import type { D1Database } from "@cloudflare/workers-types";
import { AiSdkEmbeddingAdapter, InMemoryVectorAdapter, Memory } from "@voltagent/core";
import { google } from "./google.js";
import { voltlogger } from "./logger.js";
import z from "zod";

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
}

export const createWorker = (env: Env) => {
  const memory = new Memory({
    // @ts-ignore TS2739 This is working as intended despite the error. Tested 1/22/2026
    storage: new D1MemoryAdapter({
      binding: env.DB,
      tablePrefix: "voltagent_memory",
      logger: voltlogger,
    }),
  workingMemory: {
    enabled: true,
    scope: "user", // persist across conversations
    schema: z.object({
          profile: z
            .object({
              name: z.string().optional(),
              role: z.string().optional(),
              timezone: z.string().optional(),
            })
            .optional(),
          preferences: z.array(z.string()).optional(),
          goals: z.array(z.string()).optional(),
          researchState: z.object({
            currentPhase: z.string().optional(),
            topic: z.string().optional(),
            depth: z.string().optional(),
            quality: z.string().optional(),
          }).optional(),
        }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.embedding("gemini-embedding-001",)),
  vector: new InMemoryVectorAdapter(),
  enableCache: true, // optional embedding cache
  cacheSize: 1000, // optional cache size
  cacheTTL: 3600000, // optional cache time-to-live in seconds
}
)};


