import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltlogger } from "../config/logger.js"
import { google } from "@ai-sdk/google";
import { AiSdkEmbeddingAdapter, Memory } from "@voltagent/core";

export const libsqlMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
    logger: voltlogger,
    debug: true,
    tablePrefix: "voltagent_memory",
    maxRetries: 3,
    retryDelayMs: 100,
  }),
  workingMemory: {
    enabled: true,
    scope: "user", // persist across conversations
    template: `
# User Profile
- Name:
- Role:
- Timezone:

# Current Goals
-

# Preferences
-
`,
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
  }),
  enableCache: true, // optional embedding cache
  cacheSize: 1000, // optional cache size
  cacheTTL: 3600000, // optional cache time-to-live in seconds
});
