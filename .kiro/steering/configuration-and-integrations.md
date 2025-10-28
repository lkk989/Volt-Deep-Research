---
inclusion: always
---

# Configuration and Integrations

**Mastervolt** integrates with multiple AI providers, storage systems, and external services through a sophisticated configuration architecture.

## AI Model Configuration

### Google AI Models (Primary Provider)

- **gemini-2.5-flash-lite-preview-09-2025**: Primary model for 6 agents
  - Used by: assistant, director, dataAnalyzer, factChecker, synthesizer, scrapper
  - Context: 64k tokens, grounding enabled
  - Cost-effective for production workloads

- **gemini-2.5-flash-preview-09-2025**: Enhanced model for writer agent
  - Higher capability model for complex report generation
  - Extended context and reasoning capabilities

- **text-embedding-004**: Embedding model for all agents
  - Semantic search and memory operations
  - Shared across all agent memory systems

### Model Context Protocol (MCP) Integration

#### Project MCP Configuration (src/config/mcp.ts)

- **Filesystem Server**: Local file system access
  - Type: stdio server via @modelcontextprotocol/server-filesystem
  - Command: `npx -y @modelcontextprotocol/server-filesystem`
  - Access Path: User's Desktop directory
  - Timeout: 60 seconds
  - Used for: Document processing and local file operations

- **Hugging Face Server**: Remote AI model access
  - Type: HTTP server
  - URL: `https://huggingface.co/mcp`
  - Authentication: Bearer token via HUGGING_FACE_TOKEN
  - Timeout: 60 seconds
  - Used for: AI model access and dataset operations

#### MCP Server (src/config/mcpserver.ts)

- **Name**: "voltagent-example"
- **Version**: "0.1.0"
- **Description**: "VoltAgent MCP example"
- **Purpose**: Internal MCP server for agent communication

## Agent-to-Agent (A2A) Communication

### A2A Server (src/a2a/server.ts)

- **Service Name**: "support-agent"
- **Port**: 3141
- **Framework**: Hono web framework
- **Purpose**: Inter-agent task coordination and communication

### A2A Store (src/a2a/store.ts)

- **Implementation**: SupaTaskStore
- **Backend**: Supabase persistence layer
- **Key Format**: `agentId::taskId` for task identification
- **Features**: Distributed task management, state synchronization

## Memory & Storage Architecture

### LibSQL Database System

- **Per-Agent Storage**: `.voltagent/{agent-id}-memory.db`
  - assistant-memory.db, writer-memory.db, director-memory.db
  - data-analyzer-memory.db, fact-checker-memory.db
  - synthesizer-memory.db, scrapper-memory.db

- **Shared Vector Store**: `.voltagent/memory.db`
  - Cross-agent semantic search
  - Embedding cache and retrieval
  - Unified knowledge base

- **Observability Storage**: `.voltagent/observability.db`
  - OpenTelemetry trace data
  - Performance metrics and analytics
  - Error tracking and debugging

### Working Memory Schema (All Agents)

```typescript
z.object({
  profile: z.object({
    name: z.string().optional(),
    role: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  preferences: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
})
```

### Memory Configuration

- **Scope**: User-scoped persistence across conversations
- **Embedding Cache**: 1000 embeddings, 1-hour TTL
- **Cache Enabled**: All agents use embedding caching
- **Vector Adapter**: LibSQLVectorAdapter with shared storage

## Logging & Observability

### VoltLogger Configuration (src/config/logger.ts)

- **Framework**: Pino-based logging system
- **Level**: trace (comprehensive logging)
- **Service Name**: "Voltlogger"
- **Custom Serializers**: Request object serialization
- **Hooks**: Custom log method processing

### VoltOps Integration

- **Service Name**: "VoltMaster"
- **Sampling Strategy**: 50% ratio sampling
- **Batch Configuration**:
  - Max Queue Size: 4096 events
  - Max Export Batch: 512 events
  - Scheduled Delay: 4 seconds
  - Export Timeout: 30 seconds

### OpenTelemetry Instrumentation

- **SDK**: Full NodeSDK with auto-instrumentations
- **Tracing**: Comprehensive operation tracking
- **Metrics**: Performance and usage analytics
- **Integration**: VoltOps automatic forwarding

## External Service Integrations

### Supabase Integration

- **Purpose**: Alternative memory adapter and A2A store
- **Features**: User profiles, distributed state management
- **Configuration**: Via environment variables
- **Usage**: Task store backend, optional memory adapter

### Environment Configuration

#### Required Environment Variables

```bash
GOOGLE_GENERATIVE_AI_API_KEY=    # Google AI access
VOLTAGENT_PUBLIC_KEY=            # VoltOps integration
VOLTAGENT_SECRET_KEY=            # VoltOps authentication
```

#### Optional Environment Variables

```bash
EXA_API_KEY=                     # Exa search integration
HUGGING_FACE_TOKEN=              # Hugging Face MCP access
SUPABASE_URL=                    # Supabase backend
SUPABASE_ANON_KEY=               # Supabase authentication
```

## Development & Production Configuration

### Development Mode

- **Command**: `npm run dev`
- **Features**: tsx watch, .env loading, hot reload
- **Logging**: Full trace-level logging enabled
- **Memory**: Local SQLite databases

### Production Mode

- **Command**: `npm start`
- **Features**: Compiled JavaScript execution
- **Logging**: Structured JSON logging
- **Observability**: Full telemetry enabled
- **Memory**: Persistent LibSQL databases

### Configuration Validation

- **Environment**: Startup validation of required variables
- **Schemas**: Zod validation for all configuration objects
- **Error Handling**: Graceful degradation for optional services
- **Monitoring**: Configuration health checks via observability
