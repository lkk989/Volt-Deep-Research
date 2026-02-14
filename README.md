<div align="center">

<a href="https://voltagent.dev/">
<img width="1800" alt="VoltAgent Banner" src="https://github.com/user-attachments/assets/452a03e7-eeda-4394-9ee7-0ffbcf37245c" />
</a>

<br/>
<br/>

# Mastervolt Deep Research

**Enterprise-grade multi-agent research system powered by VoltAgent**

<br/>

[![VoltAgent](https://img.shields.io/npm/v/@voltagent/core?label=VoltAgent&logo=npm&color=CB3837)](https://www.npmjs.com/package/@voltagent/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![AI SDK](https://img.shields.io/npm/v/ai?label=AI%20SDK&logo=vercel&color=000000)](https://www.npmjs.com/package/ai)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[![Google AI](https://img.shields.io/npm/v/@ai-sdk/google?label=Google%20AI&logo=google&color=4285F4)](https://www.npmjs.com/package/@ai-sdk/google)
[![OpenAI](https://img.shields.io/npm/v/@ai-sdk/openai?label=OpenAI&logo=openai&color=412991)](https://www.npmjs.com/package/@ai-sdk/openai)
[![LibSQL](https://img.shields.io/npm/v/@voltagent/libsql?label=LibSQL&logo=sqlite&color=003B57)](https://www.npmjs.com/package/@voltagent/libsql)
[![Vitest](https://img.shields.io/npm/v/vitest?label=Vitest&logo=vitest&color=6E9F18)](https://www.npmjs.com/package/vitest)
[![Zod](https://img.shields.io/npm/v/zod?label=Zod&logo=zod&color=3E67B1)](https://www.npmjs.com/package/zod)

[Documentation](https://voltagent.dev/docs/) • [VoltOps Platform](https://console.voltagent.dev) • [Discord](https://s.voltagent.dev/discord) • [Examples](https://github.com/voltagent/voltagent/tree/main/examples)

</div>

<br/>

---

## Overview

Mastervolt Deep Research is a sophisticated multi-agent orchestration system built on VoltAgent that automates complex research workflows. It combines specialized AI agents, semantic memory, intelligent tooling, and custom web scraping to conduct comprehensive research, verify facts, analyze data, and generate publication-ready reports.

### Key Features

- Multi-Agent Orchestration - PlanAgent-supervised coordination of 14+ specialized agents
- Semantic Memory - LibSQL-backed vector storage with Google text embeddings
- Custom Web Scraping - Purpose-built web scraper toolkit for research data collection
- Financial Markets - Stock, crypto, and financial analysis toolkits with no API keys required
- Workspace System - Isolated sandbox environments with filesystem, search, and skills
- Rich AI UI System - 49 specialized components for visualizing agent outputs
- Interactive Chat Interface - Built-in Next.js chat with real-time streaming
- Code Execution - Terminal emulation, code sandbox, and test result visualization
- Fact Checking - Automated verification with custom claim checking and bias detection
- Report Generation - PhD-level research reports with citations and structured formatting
- A2A Communication - Agent-to-agent message passing and shared state management
- Observability - OpenTelemetry tracing with VoltOps platform integration

---

## Architecture

### How Everything Connects

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': 'transparent', 'primaryColor': '#8B5CF6', 'lineColor': '#3B82F6', 'primaryTextColor': '#ffffff', 'nodeBkg': '#0b0b0d', 'clusterBkg': 'transparent', 'edgeLabelBackground': 'transparent', 'sectionBkgColor': 'transparent', 'altSectionBkgColor': 'transparent', 'textColor': '#ffffff', 'fontFamily':'"Inter", Arial, sans-serif', 'stroke': '#3B82F6' }}}%%
graph TB
    subgraph "Frontend (Next.js)"
        UI[Chat Interface]
        AI_Elements[49 AI UI Components]
    end

    subgraph "API Layer"
        ChatAPI[/api/chat]
        MessagesAPI[/api/messages]
    end

    subgraph "Memory Layer"
        SharedMemory[(LibSQL sharedMemory)]
        Vector[(Vector Store)]
    end

    subgraph "VoltAgent Backend"
        PlanAgent[Plan Agent - Orchestrator]
    end

    subgraph "Specialized Agents"
        Assistant[Assistant]
        Writer[Writer]
        Scrapper[Scrapper]
        DataAnalyzer[Data Analyzer]
        FactChecker[Fact Checker]
        Synthesizer[Synthesizer]
        Coding[Coding Agent]
        DataScientist[Data Scientist]
    end

    subgraph "Toolkits"
        WS_Tools[Workspace<br/>Filesystem/Search<br/>Sandbox/Skills]
        Web[Web Scraper]
        Market[Stock/Crypto<br/>Financial]
        Code[Code Analysis<br/>Git/Test]
        Data[Data Processing<br/>Visualization]
    end

    subgraph "External Services"
        GoogleAI[Google AI<br/>Gemini]
        MCP[MCP Servers]
    end

    UI -->|useChat| ChatAPI
    ChatAPI -->|streamText| PlanAgent
    ChatAPI -->|addMessage| SharedMemory
    SharedMemory -->|retrieve| Vector
    PlanAgent -->|coordinate| Assistant
    PlanAgent -->|coordinate| Writer
    PlanAgent -->|coordinate| Scrapper
    PlanAgent -->|coordinate| DataAnalyzer
    PlanAgent -->|coordinate| FactChecker
    PlanAgent -->|coordinate| Synthesizer
    PlanAgent -->|coordinate| Coding
    PlanAgent -->|coordinate| DataScientist

    Assistant --> WS_Tools
    Writer --> WS_Tools
    Coding --> WS_Tools
    Coding --> Code
    DataScientist --> Market
    DataAnalyzer --> Market
    Scrapper --> Web

    PlanAgent --> GoogleAI
    Assistant --> GoogleAI
    Writer --> GoogleAI
    Coding --> MCP

    ChatAPI -->|streaming| AI_Elements
    AI_Elements --> UI
```

### Multi-Agent Workflow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': 'transparent', 'primaryColor': '#8B5CF6', 'lineColor': '#3B82F6', 'primaryTextColor': '#ffffff', 'nodeBkg': '#0b0b0d', 'clusterBkg': 'transparent', 'edgeLabelBackground': 'transparent', 'sectionBkgColor': 'transparent', 'altSectionBkgColor': 'transparent', 'textColor': '#ffffff', 'fontFamily':'"Inter", Arial, sans-serif', 'stroke': '#3B82F6' }}}%%
graph TB
    User[User] -->|Submits Topic| PlanAgent
    PlanAgent -->|Generates Queries| Assistant
    PlanAgent -->|Scrapes Web| Scrapper
    PlanAgent -->|Analyzes Data| DataAnalyzer
    PlanAgent -->|Verifies Facts| FactChecker
    PlanAgent -->|Synthesizes| Synthesizer
    PlanAgent -->|Writes Report| Writer

    Scrapper -->|Content| DataAnalyzer
    DataAnalyzer -->|Insights| Synthesizer
    FactChecker -->|Verified| Synthesizer
    Synthesizer -->|Structured| Writer
    Writer -->|Final Report| User

    subgraph "Memory"
        Memory[(LibSQL)]
        Vector[(Vector)]
    end

    PlanAgent -.-> Memory
    Assistant -.-> Vector
    Writer -.-> Memory
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Google Generative AI API key (required)

### Installation

```bash
# Clone the repository
git clone https://github.com/ssdeanx/Mastervolt-Deep-Research.git
cd Mastervolt-Deep-Research

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Configuration

Edit `.env` with your API keys:

```bash
GOOGLE_GENERATIVE_AI_API_KEY='your_google_generative_ai_api_key_here'

# Optional integrations
# SUPABASE_URL='your_supabase_url'
# SUPABASE_KEY='your_supabase_key'
# TURSO_URL='your_turso_url'
# TURSO_AUTH_TOKEN='your_turso_token'
```

### Running the System

```bash
# Development mode with auto-reload (Agents)
npm run dev

# Start Next.js UI (Chat Interface)
npm run next

# Run both concurrently
npm run dev:test

# Build for production
npm run build

# Start production server
npm start
```

### Interacting with Agents

1. Start the Next.js application: `npm run next`
2. Open http://localhost:3000 in your browser
3. Use the chat interface to submit research topics

---

## AI UI System (49 Components)

The `components/ai-elements/` directory contains specialized React components for rendering rich agent outputs:

### Conversation & Messages

- `conversation.tsx` - Chat container with scroll management, auto-scroll, empty state
- `message.tsx` - Message bubble with user/assistant differentiation, branching support
- `loader.tsx` - Loading states with streaming indicators
- `shimmer.tsx` - Skeleton loading animations

### Input Components

- `prompt-input.tsx` - Rich text input with attachments, model selection
- `speech-input.tsx` - Voice input with transcription

### Reasoning & Thinking

- `reasoning.tsx` - Collapsible reasoning display with duration tracking
- `chain-of-thought.tsx` - Visual step-by-step reasoning with status icons

### Tool Execution

- `tool.tsx` - Tool invocation display with status badges (Running/Completed/Error)
- `terminal.tsx` - Terminal emulator with ANSI color support, streaming output
- `sandbox.tsx` - Code sandbox container with tabbed interface for multiple outputs

### Content Rendering

- `artifact.tsx` - Generated content container (code files, documents)
- `code-block.tsx` - Syntax-highlighted code using Shiki (100+ languages)
- `message.tsx` - Markdown rendering with Streamdown plugins

### Data Visualization

- `sources.tsx` - Source citations with URLs and descriptions
- `file-tree.tsx` - Directory structure visualization
- `schema-display.tsx` - JSON schema rendering
- `snippet.tsx` - Code snippet display
- `test-results.tsx` - Test results with pass/fail stats

### Feedback & Interaction

- `confirmation.tsx` - Approval/rejection dialogs
- `suggestion.tsx` - Prompt suggestions
- `checkpoint.tsx` - Task progress with status indicators

### Media & Preview

- `image.tsx` - Image rendering
- `audio-player.tsx` - Audio playback
- `web-preview.tsx` - Embedded web content
- `canvas.tsx` - Drawing/visualization canvas

### Advanced Components

- `plan.tsx` - Task plan visualization
- `task.tsx` - Individual task display
- `queue.tsx` - Pending tasks queue
- `connection.tsx` - Agent connection visualization
- `node.tsx` / `edge.tsx` - Graph/node visualization
- `stack-trace.tsx` - Error stack trace display

### Metadata & Context

- `context.tsx` - Context information
- `persona.tsx` - Agent persona display
- `inline-citation.tsx` - Inline citations
- `package-info.tsx` - NPM package information

---

## Workspace System

The workspace system provides agents with isolated, secure environments for file operations and code execution.

### Components

| Component  | Purpose                                                             |
| ---------- | ------------------------------------------------------------------- |
| Filesystem | Virtual file operations (ls, read, write, edit, delete, glob, grep) |
| Search     | BM25/vector/hybrid search over indexed workspace content            |
| Sandbox    | Timeboxed shell command execution in isolated directory             |
| Skills     | Discoverable SKILL.md folders with prompt injection hooks           |

### Default Locations

- Filesystem root: `./.workspace/fs`
- Sandbox root: `./.workspace/sandbox`
- Skills seed: copied from `voltagent/workspaces/seed/skills`

### Security Features

- Path traversal prevention
- Filesystem containment (all ops under root)
- Sandbox containment (cwd stays in sandbox root)
- Per-tool policies (enabled/needsApproval/requireReadBeforeWrite)

---

## Market Data Toolkits

### Stock Market Toolkit

No-API-key stock data using Yahoo + Stooq:

- `stock_spot_price` - Current price (Yahoo primary, Stooq fallback)
- `stock_batch_quote` - Batch quotes for multiple symbols
- `stock_ohlcv` - OHLCV chart bars
- `stock_stooq_daily` - Daily historical data
- `stock_multi_source_price` - Multi-source consensus price
- `stock_symbol_search` - Company name to symbol lookup

### Crypto Market Toolkit

No-API-key crypto data via Binance + DexScreener:

- `crypto_spot_price` - Spot price with provider fallback
- `crypto_ohlcv` - OHLCV candles
- `crypto_exchange_info` - Exchange metadata
- `crypto_24h_ticker` - 24h price changes
- `crypto_order_book` - Order book depth
- `crypto_recent_trades` - Recent trade history
- `dexscreener_search` - Token search
- `dexscreener_pair` - Pair data and liquidity

### Financial Analysis Toolkit

Technical indicators and statistical analysis:

- `calculate_moving_average` - SMA/EMA calculation
- `calculate_rsi` - Relative Strength Index
- `calculate_macd` - MACD indicator
- `calculate_bollinger_bands` - Bollinger Bands
- `calculate_atr` - Average True Range
- `calculate_adx` - Average Directional Index
- `calculate_stochastic` - Stochastic oscillator
- Statistical functions: correlation, regression, variance, skewness, kurtosis

### Alpha Vantage Toolkit

Requires `ALPHA_VANTAGE_API_KEY`:

- Time series data (intraday/daily/weekly/monthly)
- Fundamental data
- Currency exchange rates

---

## Agent Capabilities

### Plan Agent

- Orchestrates entire research workflow
- Supervises 6+ sub-agents
- Full stream event forwarding
- Manages research tasks and subtasks

### Coding Agent

- Code implementation, bug fixes, refactoring
- Workspace toolkits (filesystem, search, sandbox, skills)
- Code analysis, git, test toolkits
- Low temperature (0.2) for precision

### Data Scientist Agent

- Statistical analysis and EDA
- Market data toolkits (stock, crypto, financial)
- Data processing and visualization
- Dynamic model selection

### Assistant Agent

- Query generation and research coordination
- Weather and reasoning tools
- Semantic memory integration

### Scrapper Agent

- Web scraping with JSDOM/Cheerio/Turndown
- Batch scraping with depth control
- robots.txt respect and rate limiting

### Data Analyzer Agent

- Pattern, trend, correlation, anomaly detection
- ArXiv paper search and PDF extraction
- Multi-type analysis

### Fact Checker Agent

- Claim verification with confidence scoring
- Cross-reference source analysis
- Bias detection with credibility scoring

### Synthesizer Agent

- Multi-source information synthesis
- Contradiction resolution
- Unified narrative creation

### Writer Agent

- PhD-level research reports
- Quality levels (elementary to expert)
- Citation management with footnotes
- Markdown formatting

---

## Project Structure

```bash
Mastervolt-Deep-Research/
├── app/                         # Next.js 16 App Router
│   ├── api/                     # API Routes
│   │   ├── chat/               # Chat endpoint (POST, stream)
│   │   └── messages/           # Message retrieval (GET)
│   ├── dashboard/              # Protected dashboard
│   │   ├── chat/               # Chat interface page
│   │   └── _components/        # ChatPanel, ChatInput, ChatMessages
│   └── _components/            # Shared UI components
├── components/
│   ├── ai-elements/            # 49 AI UI components
│   │   ├── conversation.tsx
│   │   ├── message.tsx
│   │   ├── tool.tsx
│   │   ├── terminal.tsx
│   │   ├── sandbox.tsx
│   │   ├── reasoning.tsx
│   │   ├── code-block.tsx
│   │   └── ... (41 more)
│   └── ui/                    # Shadcn/Radix design system
├── voltagent/                  # Multi-agent backend
│   ├── index.ts               # VoltAgent initialization
│   ├── agents/                # 16 specialized agents
│   │   ├── plan.agent.ts
│   │   ├── coding.agent.ts
│   │   ├── data-scientist.agent.ts
│   │   ├── assistant.agent.ts
│   │   ├── writer.agent.ts
│   │   ├── scrapper.agent.ts
│   │   ├── data-analyzer.agent.ts
│   │   ├── fact-checker.agent.ts
│   │   ├── synthesizer.agent.ts
│   │   └── ... (6 more)
│   ├── tools/                 # 28+ toolkits
│   │   ├── stock-market-toolkit.ts
│   │   ├── crypto-market-toolkit.ts
│   │   ├── financial-analysis-toolkit.ts
│   │   ├── web-scraper-toolkit.ts
│   │   ├── workspace-toolkit.ts
│   │   └── ... (22 more)
│   ├── workspaces/            # Workspace system
│   │   ├── index.ts           # Shared toolkit exports
│   │   ├── workspace-runtime.ts
│   │   └── toolkits/          # Workspace-specific toolkits
│   ├── config/               # Configuration
│   │   ├── libsql.ts         # sharedMemory config
│   │   ├── logger.ts
│   │   └── observability.ts
│   └── a2a/                  # Agent-to-Agent
├── lib/                       # Shared utilities
└── memory-bank/              # AI context memory
```

---

## Data Flow: Chat to Agents

### Request Flow

```bash
1. User types message in ChatPanel
2. useChat hook sends to /api/chat (POST)
3. API adds user message to sharedMemory
4. API calls deepAgent.streamText()
5. Plan Agent orchestrates sub-agents
6. Streaming response via SSE
7. AI Elements render in real-time
```

### API Endpoints

| Endpoint                | Method | Purpose                              |
| ----------------------- | ------ | ------------------------------------ |
| `/api/chat`             | POST   | Send message, get streaming response |
| `/api/chat/[id]/stream` | GET    | Resume interrupted stream            |
| `/api/messages`         | GET    | Retrieve stored messages             |

### sharedMemory

LibSQL-backed persistent memory:

- Stores conversation messages
- Provides semantic search via vector embeddings
- Manages working memory (user context)
- Configuration in `voltagent/config/libsql.ts`

---

## Development

### Commands

```bash
npm run dev          # VoltAgent dev server (watch mode)
npm run dev:next     # Next.js dev server
npm run dev:test     # Run both concurrently
npm run build:volt   # Compile TypeScript
npm run build:next   # Build Next.js
npm start            # Production server
npm test            # Run tests
npm run lint        # ESLint
npm run prettier    # Format code
```

---

## Key Technologies

| Technology     | Version | Purpose                   |
| -------------- | ------- | ------------------------- |
| VoltAgent Core | ^2.1.5  | Multi-agent orchestration |
| TypeScript     | 5.9.3   | Strict mode type safety   |
| AI SDK         | ^6.0.86 | Multi-model abstraction   |
| Google AI      | ^3.0.29 | Gemini integration        |
| LibSQL         | ^2.0.2  | Memory & vector storage   |
| Zod            | 4.1.13  | Runtime validation        |
| Vitest         | 4.0.18  | Testing                   |
| OpenTelemetry  | 0.210.0 | Observability             |
| Cheerio/JSDOM  | -       | Web scraping              |
| Next.js        | 16.1.4  | React framework           |
| React          | 19.x    | UI library                |

---

## Advanced Features

### Semantic Memory

- Per-agent LibSQL databases (`.voltagent/{agent-id}-memory.db`)
- Shared vector store (`.voltagent/memory.db`)
- Google text-embedding-004
- Embedding cache (1000 entries, 1 hour TTL)

### Observability

- OpenTelemetry tracing
- VoltOps platform integration
- 50% sampling ratio
- 512 events per batch, 4s intervals

### Workflow Chaining

Type-safe composition with Zod schemas:

```typescript
const workflow = createWorkflowChain({
    id: 'research',
    input: z.object({ topic: z.string() }),
    result: z.object({ report: z.string() }),
})
    .andThen({
        id: 'research',
        execute: async ({ data }) => {
            /* ... */
        },
    })
    .andThen({
        id: 'write',
        execute: async ({ data }) => {
            /* ... */
        },
    })
```

---

## Use Cases

- Academic Research - Literature review, arXiv integration, citation management
- Financial Analysis - Stock/crypto data, technical indicators, pattern detection
- Market Intelligence - Competitive analysis, trend identification
- Technical Documentation - API docs, knowledge base creation
- Code Development - Implementation, testing, code review
- Investigative Journalism - Fact-checking, bias detection
- Due Diligence - Company research, risk assessment

---

## Resources

- [VoltAgent Documentation](https://voltagent.dev/docs/)
- [VoltOps Platform](https://console.voltagent.dev)
- [Discord Community](https://s.voltagent.dev/discord)
- [Blog](https://voltagent.dev/blog/)

---

## Acknowledgments

Built with [VoltAgent](https://voltagent.dev/) - the open-source TypeScript framework for building and orchestrating AI agents.

---

<div align="center">

**Powered by VoltAgent**

</div>
