# Supabase Memory

`SupabaseMemoryAdapter` stores conversations in Supabase Postgres for applications already using Supabase.

## Installation

```bash
npm install @voltagent/supabase @supabase/supabase-js
```

## Database Setup

Run this SQL in your Supabase SQL Editor (adjusts table prefix if needed):

*Schema SQL content not available in fetched data - please refer to the original documentation for the complete SQL schema.*

## Credentials

Get your Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Open your project
3. Go to Project Settings → API
4. Copy Project URL and anon key

Store as environment variables: `SUPABASE_URL` and `SUPABASE_KEY`

## Configuration

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| supabaseUrl | string | Supabase project URL (required if not using client) |
| supabaseKey | string | Supabase anon key (required if not using client) |
| client | SupabaseClient | Existing Supabase client (alternative to URL/key) |
| tableName | string | Table name prefix (default: voltagent_memory) |
| debug | boolean | Enable debug logging (default: false) |
| logger | Logger | Optional logger for structured logging |

Note: Table prefix must match the SQL schema. If you use a custom `tableName`, update the SQL accordingly.

```typescript
import { Agent, Memory } from "@voltagent/core"
import { SupabaseMemoryAdapter } from "@voltagent/supabase"
import { openai } from "@ai-sdk/openai"

// Using URL and key
const memory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
  }),
})

// Using existing Supabase client
import { createClient } from "@supabase/supabase-js"

const supabaseClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

const memory = new Memory({
  storage: new SupabaseMemoryAdapter({
    client: supabaseClient,
  }),
})

const agent = new Agent({
  name: "Assistant",
  model: openai("gpt-4o-mini"),
  memory,
})
```

## Features

### Working Memory

```typescript
const memory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
  }),
  workingMemory: {
    enabled: true,
    scope: "conversation", // or "user"
  },
})
```

See [Working Memory](https://voltagent.dev/docs/agents/memory/working-memory/).

### Semantic Search

```typescript
import { Memory, AiSdkEmbeddingAdapter, InMemoryVectorAdapter } from "@voltagent/core"
import { SupabaseMemoryAdapter } from "@voltagent/supabase"
import { openai } from "@ai-sdk/openai"

const memory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
  }),
  embedding: new AiSdkEmbeddingAdapter(openai.embedding("text-embedding-3-small")),
  vector: new InMemoryVectorAdapter(), // or pgvector adapter
})
```

See [Semantic Search](https://voltagent.dev/docs/agents/memory/semantic-search/).

- Messages stored per `userId` and `conversationId`
- Supports complex queries with filtering, pagination, and sorting
- No automatic message pruning - all messages are preserved

## Production Setup

```typescript
import { Agent, Memory } from "@voltagent/core"
import { SupabaseMemoryAdapter } from "@voltagent/supabase"
import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY! // or service_role key for backend
)

const memory = new Memory({
  storage: new SupabaseMemoryAdapter({
    client: supabaseClient,
  }),
})

const agent = new Agent({
  name: "Assistant",
  model: openai("gpt-4o-mini"),
  memory,
})
```

Security:

- Use `anon` key with Row Level Security (RLS) policies
- Use `service_role` key only in secure backend environments
- Store credentials in environment variables

Use cases:

- Applications already using Supabase
- Projects leveraging Supabase Auth, Realtime, or Storage
- Environments requiring RLS policies

For production-ready zero-setup hosting, see [Managed Memory](https://voltagent.dev/docs/agents/memory/managed-memory/).

## Learn More

- [Managed Memory](https://voltagent.dev/docs/agents/memory/managed-memory/) - Production-ready hosted memory with zero setup
- [Working Memory](https://voltagent.dev/docs/agents/memory/working-memory/) - Maintain compact context
- [Semantic Search](https://voltagent.dev/docs/agents/memory/semantic-search/) - Vector search configuration
