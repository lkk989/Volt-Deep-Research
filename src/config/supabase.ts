import { Memory } from "@voltagent/core";
import { SupabaseMemoryAdapter } from "@voltagent/supabase";

// Using URL and key
export const supaMemory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
  }),
});

