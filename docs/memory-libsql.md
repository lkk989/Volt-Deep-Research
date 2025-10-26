# LibSQL / SQLite Memory

`LibSQLMemoryAdapter` stores conversations in LibSQL, supporting local SQLite files, remote instances, and self-hosted `sqld`.

## Installation

```bash
npm install @voltagent/libsql
```

## Configuration

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| url | string | Connection URL (`file:<path>`, libsql://, or :memory:) |
| authToken | string | Auth token for remote instances (optional for local files) |
| tablePrefix | string | Table name prefix (default: voltagent_memory) |
| logger | Logger | Optional logger for debugging |

### URL Formats

- Local SQLite: `file:./.voltagent/memory.db` or `file:memory.db`
- In-memory (testing): `:memory:` or `file::memory:`
- Remote instance (e.g., Turso): `libsql://your-database.example.io`
- Self-hosted sqld: `libsql://your-server.com` or `https://your-server.com`

```typescript
import { Agent, Memory } from "@voltagent/core"
import { LibSQLMemoryAdapter } from "@voltagent/libsql"
import { openai } from "@ai-sdk/openai"

// Local SQLite
const memory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/memory.db", // or ":memory:" for ephemeral
  }),
})

// Remote instance
const memory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "libsql://your-database.example.io",
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  }),
})

const agent = new Agent({
  name: "Assistant",
  model: openai("gpt-4o-mini"),
  memory,
})
```

## Features

### Automatic Schema Creation

Tables are created automatically on first use:

- `${tablePrefix}_users`
- `${tablePrefix}_conversations`
- `${tablePrefix}_messages`
- `${tablePrefix}_workflow_states`

Schema migrations run automatically when updating VoltAgent versions.

### Conversation Storage

- Messages stored per `userId` and `conversationId`
- All `StorageAdapter` methods supported
- No automatic message pruning - all messages are preserved

### Working Memory

Supports both conversation and user-scoped working memory:

```typescript
const memory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/memory.db" }),
  workingMemory: {
    enabled: true,
    scope: "conversation", // or "user"
    template: `# Context\n- Key facts:\n`,
  },
})
```

See [Working Memory](https://voltagent.dev/docs/agents/memory/working-memory/) for configuration details.

### Vector Storage (Optional)

Use `LibSQLVectorAdapter` for persistent vector storage:

```typescript
import { Memory, AiSdkEmbeddingAdapter } from "@voltagent/core"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { openai } from "@ai-sdk/openai"

const memory = new Memory({
  storage: new LibSQLMemoryAdapter({ url: "file:./.voltagent/memory.db" }),
  embedding: new AiSdkEmbeddingAdapter(openai.embedding("text-embedding-3-small")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
})
```

Vector adapter options:

- Local file: Same URL as storage adapter
- In-memory: `:memory:` (vectors lost on restart)
- Turso: Same URL + auth token as storage adapter

See [Semantic Search](https://voltagent.dev/docs/agents/memory/semantic-search/) for usage.

Use cases:

- Local development with SQLite files
- Edge deployments with remote instances
- Serverless environments
- Simple deployments without separate database servers

For production-ready zero-setup hosting, see [Managed Memory](https://voltagent.dev/docs/agents/memory/managed-memory/).

## Examples

### Development with Local SQLite

```typescript
import { Agent, Memory } from "@voltagent/core"
import { LibSQLMemoryAdapter } from "@voltagent/libsql"
import { openai } from "@ai-sdk/openai"

const agent = new Agent({
  name: "Dev Assistant",
  model: openai("gpt-4o-mini"),
  memory: new Memory({
    storage: new LibSQLMemoryAdapter({
      url: "file:./.voltagent/dev-memory.db",
    }),
  }),
})
```

### Remote Instance

```typescript
import { Agent, Memory } from "@voltagent/core"
import { LibSQLMemoryAdapter } from "@voltagent/libsql"
import { openai } from "@ai-sdk/openai"

const agent = new Agent({
  name: "Assistant",
  model: openai("gpt-4o-mini"),
  memory: new Memory({
    storage: new LibSQLMemoryAdapter({
      url: process.env.LIBSQL_DATABASE_URL!,
      authToken: process.env.LIBSQL_AUTH_TOKEN!,
    }),
  }),
})
```

### Testing with In-Memory Database

```typescript
const testMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: ":memory:", // ephemeral
  }),
})
```

## Learn More

- [Managed Memory](https://voltagent.dev/docs/agents/memory/managed-memory/) - Production-ready hosted memory with zero setup
- [Working Memory](https://voltagent.dev/docs/agents/memory/working-memory/) - Maintain compact context
- [Semantic Search](https://voltagent.dev/docs/agents/memory/semantic-search/) - Vector search with LibSQLVectorAdapter
