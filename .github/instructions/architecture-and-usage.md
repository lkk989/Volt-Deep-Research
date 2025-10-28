---
applyTo: '**'
description: 'Comprehensive project context for Mastervolt Deep Research system'
---
# Architecture and Usage

**Mastervolt Deep Research** is a production-grade multi-agent AI research system built on VoltAgent v1.1.37, demonstrating enterprise-level agent orchestration, workflow management, and comprehensive research capabilities.

## System Architecture

### Core Framework

- **Base Framework**: VoltAgent TypeScript framework for AI agent orchestration
- **Version**: v1.1.37 (latest stable)
- **Runtime**: Node.js 18+ with ES2022 modules
- **Package Manager**: npm with strict dependency management
- **Build System**: TypeScript 5.9.3 with strict mode

### Multi-Agent Research Pipeline

#### Primary Workflow: "research-assistant"

1. **Query Generation** (assistantAgent): Generates 3 diverse search queries
2. **Report Synthesis** (writerAgent): Creates structured 2-paragraph reports with citations

#### Advanced Multi-Agent Orchestration (directorAgent)

1. **Assistant** → Query formulation and research coordination
2. **Scrapper** → Web data extraction and content collection
3. **DataAnalyzer** → Pattern analysis and insight extraction
4. **FactChecker** → Verification and bias detection
5. **Synthesizer** → Multi-source integration and contradiction resolution
6. **Writer** → Final report composition and formatting

### Data Flow Architecture

#### Memory System

- **Per-Agent Storage**: LibSQL databases (.voltagent/{agent-id}-memory.db)
- **Shared Vector Store**: Unified semantic search (.voltagent/memory.db)
- **Working Memory**: User-scoped profiles, preferences, goals
- **Embedding Cache**: 1000 embeddings, 1-hour TTL

#### Communication Layer

- **A2A Server**: Hono-based server on port 3141
- **Task Store**: Supabase-backed distributed state management
- **MCP Integration**: Filesystem and Hugging Face servers
- **Observability**: OpenTelemetry with LibSQL storage

## Usage Patterns

### Development Workflow

```bash
# Setup and development
npm install                    # Install dependencies
npm run dev                   # Start development server with watch
npm run build                 # Compile TypeScript to JavaScript
npm start                     # Run production server

# Quality assurance
npm run lint                  # ESLint with caching
npm run test                  # Vitest test suite
npm run eval                  # Experimental evaluations
```

### Environment Configuration

```bash
# Required environment variables
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
VOLTAGENT_PUBLIC_KEY=your_voltagent_public_key
VOLTAGENT_SECRET_KEY=your_voltagent_secret_key

# Optional integrations
HUGGING_FACE_TOKEN=your_hf_token
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### VoltOps Platform Integration

1. **Access**: <https://console.voltagent.dev>
2. **Workflow Discovery**: "Research Assistant Workflow" appears automatically
3. **Execution**: Click-to-run with topic input
4. **Monitoring**: Real-time metrics, token usage, success rates

### Research Usage Examples

```typescript
// Simple research query
const result = await workflow.execute({
  topic: "quantum computing applications in cryptography"
})

// Multi-agent orchestration via director
const comprehensiveResult = await directorAgent.generateText(
  "Conduct comprehensive research on AI ethics in healthcare"
)
```

## Production Deployment

### Performance Characteristics

- **Concurrent Agents**: 7 specialized agents with independent memory
- **Token Efficiency**: 64k max output tokens per agent
- **Step Limits**: 25 steps (standard), 30 (director), 50 (writer)
- **Memory Management**: 100 history entries per agent
- **Request Timeouts**: 30 seconds for external operations

### Scalability Features

- **Horizontal Scaling**: Independent agent processes
- **Memory Isolation**: Per-agent LibSQL databases
- **Caching**: Embedding cache reduces API calls
- **Batch Processing**: Configurable batch sizes for web scraping

### Monitoring and Observability

- **Metrics**: VoltOps integration with 50% sampling
- **Logging**: Pino-based structured logging at trace level
- **Tracing**: OpenTelemetry with comprehensive instrumentation
- **Error Tracking**: Operation ID tracking across agent interactions

## Advanced Features

### Web Scraping Capabilities

- **Batch Operations**: Up to 50 URLs, 5 depth levels
- **Content Extraction**: Markdown, code blocks, structured data
- **Rate Limiting**: Respectful delays (100-5000ms)
- **Error Recovery**: Graceful failures with retry logic

### Research Quality Assurance

- **Fact Checking**: Multi-source verification with confidence scoring
- **Bias Detection**: Content analysis across article, report, social media, academic types
- **Synthesis**: Contradiction resolution with evidence-based approaches
- **Validation**: Experimental framework with custom scorers

### Experimental Evaluation

- **Research Regression**: 5 test scenarios with 80% pass rate requirement
- **Quality Metrics**: Comprehensive scoring, synthesis quality, report structure
- **Continuous Integration**: Daily evaluation runs with performance tracking
- **Custom Scorers**: Domain-specific evaluation criteria

## Integration Patterns

### Tool Development

- **Context Awareness**: All tools check `context?.isActive`
- **Error Handling**: Comprehensive error catching with operation context
- **Logging**: Structured logging with operation IDs
- **Validation**: Zod schemas for all parameters

### Agent Communication

- **Handoff Patterns**: Director → Specialist → Writer workflows
- **State Management**: Distributed task coordination
- **Memory Sharing**: Cross-agent semantic search capabilities
- **Event Streaming**: Real-time operation monitoring

### External Service Integration

- **MCP Servers**: Filesystem access, Hugging Face models
- **AI Providers**: Google Gemini (primary), OpenAI support
- **Storage**: LibSQL for persistence, Supabase for distributed state
- **Observability**: VoltOps platform integration

## Best Practices

### Code Organization

- **Modular Design**: Separate concerns (agents, tools, config)
- **Type Safety**: Comprehensive TypeScript with strict mode
- **Error Boundaries**: Graceful degradation patterns
- **Resource Management**: Proper cleanup and timeout handling

### Research Methodology

- **Multi-Source Verification**: Cross-reference information across sources
- **Bias Awareness**: Systematic bias detection and mitigation
- **Quality Control**: Experimental validation of research outputs
- **Ethical Guidelines**: Respect for robots.txt, rate limiting, terms of service

### Performance Optimization

- **Caching Strategy**: Embedding cache for repeated queries
- **Batch Operations**: Efficient multi-page scraping
- **Memory Management**: Bounded history and cache sizes
- **Timeout Handling**: Prevent hanging operations
