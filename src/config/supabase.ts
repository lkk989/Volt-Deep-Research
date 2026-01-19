import { google } from "@ai-sdk/google";
import { AiSdkEmbeddingAdapter, InMemoryVectorAdapter, Memory } from "@voltagent/core";
import { SupabaseMemoryAdapter } from "@voltagent/supabase";
import z from "zod";

// Using URL and key
export const supaMemory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
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
});


