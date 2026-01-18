import { D1MemoryAdapter } from "@voltagent/cloudflare-d1";
import type { D1Database } from "@cloudflare/workers-types";
import { AiSdkEmbeddingAdapter, InMemoryVectorAdapter, Memory } from "@voltagent/core";
import { google } from "./google.js";
import { voltlogger } from "./logger.js";

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
}

export const createWorker = (env: Env) => {
  export const memory = new Memory({
    storage: new D1MemoryAdapter({
      binding: env.DB,
      tablePrefix: "voltagent_memory",
      logger: voltlogger,
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
  vector: new InMemoryVectorAdapter(),
  enableCache: true, // optional embedding cache
  cacheSize: 1000, // optional cache size
  cacheTTL: 3600000, // optional cache time-to-live in seconds
});

