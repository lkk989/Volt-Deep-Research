# Agent Memory

VoltAgent's `Memory` class stores conversation history and enables agents to maintain context across interactions. Supports persistent storage, semantic search, and working memory.

## Storage Providers

| Provider      | Package                  | Hosting                  | Use Case                          |
|---------------|--------------------------|--------------------------|-----------------------------------|
| InMemory      | @voltagent/core          | None (RAM only)          | Development, testing              |
| Managed Memory| @voltagent/voltagent-memory | VoltOps-hosted          | Production-ready, zero-setup      |
| LibSQL        | @voltagent/libsql        | Local SQLite or remote   | Self-hosted, edge deployments     |
| Postgres      | @voltagent/postgres      | Self-hosted Postgres     | Existing Postgres infrastructure  |
| Supabase      | @voltagent/supabase      | Supabase                 | Supabase-based applications       |

## Core Features

- Conversation Storage - Messages stored per `userId` and `conversationId`
- Semantic Search - Retrieve past messages by similarity (requires embedding + vector adapters)
- Working Memory - Compact context storage (Markdown template, JSON schema, or free-form)
- Workflow State - Suspendable workflow checkpoint storage

## Quick Start

```typescript
import { Agent, Memory } from "@voltagent/core";
import { ManagedMemoryAdapter } from "@voltagent/voltagent-memory";
import { openai } from "@ai-sdk/openai";

const memory = new Memory({
  storage: new ManagedMemoryAdapter({
    databaseName: "my-app-memory",
  }),
});

const agent = new Agent({
  name: "Assistant",
  model: openai("gpt-4o-mini"),
  memory,
});

// First message
await agent.generateText("My name is Sarah", {
  userId: "user-123",
  conversationId: "chat-001",
});

// Agent remembers context
await agent.generateText("What's my name?", {
  userId: "user-123",
  conversationId: "chat-001",
});
```

## Complete Documentation

For detailed configuration, provider setup, and advanced features:

- [Memory Overview](https://voltagent.dev/docs/agents/memory/overview/) - Full memory system documentation
- [Managed Memory](https://voltagent.dev/docs/agents/memory/managed-memory/) - Production-ready hosted storage
- [Semantic Search](https://voltagent.dev/docs/agents/memory/semantic-search/) - Vector-based message retrieval
- [Working Memory](https://voltagent.dev/docs/agents/memory/working-memory/) - Compact context management
- [Storage Adapters](https://voltagent.dev/docs/agents/memory/in-memory/) - Provider-specific guides

## Additional Links

- [VoltAgent home](https://voltagent.dev/)
- [Discord](https://s.voltagent.dev/discord)
- [GitHub](https://github.com/voltagent/voltagent)
- [VoltAgent Docs](https://voltagent.dev/docs/)
- [VoltOps Docs](https://voltagent.dev/voltops-llm-observability-docs/)
- [←Tools](https://voltagent.dev/docs/agents/tools/)
- [MCP Client→](https://voltagent.dev/docs/agents/mcp/)
