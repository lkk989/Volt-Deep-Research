import { google } from "@ai-sdk/google";
import { AiSdkEmbeddingAdapter, Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import z from "zod";
import { voltlogger } from "./logger.js";

export const sharedMemory = new Memory({
  // @ts-ignore TS2739 This is working as intended despite the error. Tested 1/22/2026
  storage: new LibSQLMemoryAdapter({
    url: process.env.TURSO_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN ?? "",
    logger: voltlogger,
    debug: true,
    tablePrefix: "voltagent_memory",
    maxRetries: 3,
    retryDelayMs: 100,
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
      notes: z.array(z.string()).optional(),
      researchState: z.object({
        currentPhase: z.string().optional(),
        topic: z.string().optional(),
        depth: z.string().optional(),
        quality: z.string().optional(),
      }).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.embedding("gemini-embedding-001",)),
  vector: new LibSQLVectorAdapter({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
    logger: voltlogger,
    tablePrefix: "voltagent_vector",
    debug: true,
    maxRetries: 3,
    retryDelayMs: 100,
    maxVectorDimensions: 3072,
    cacheSize: 200,
    batchSize: 100,
  }),
  enableCache: true, // optional embedding cache
  cacheSize: 1000, // optional cache size
  cacheTTL: 3600000, // optional cache time-to-live in seconds
});
