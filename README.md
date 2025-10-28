<div align="center">

<a href="https://voltagent.dev/">
<img width="1800" alt="VoltAgent Banner" src="https://github.com/user-attachments/assets/452a03e7-eeda-4394-9ee7-0ffbcf37245c" />
</a>

<br/>
<br/>

# 🔋 Mastervolt Deep Research

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

- **🤖 Multi-Agent Orchestration** - Director-supervised coordination of 7 specialized agents
- **🧠 Semantic Memory** - LibSQL-backed vector storage with Google text embeddings
- **🔍 Custom Web Scraping** - Purpose-built web scraper toolkit for research data collection
- **📊 Data Analysis** - ArXiv integration, data conversion, filesystem operations, and visualization
- **✅ Fact Checking** - Automated verification with custom claim checking and bias detection tools
- **📝 Report Generation** - PhD-level research reports with citations and structured formatting
- **🔄 A2A Communication** - Agent-to-agent message passing and shared state management
- **📈 Observability** - OpenTelemetry tracing with VoltOps platform integration
- **🎯 Type Safety** - Zod schema validation throughout the workflow chain

## Architecture


### Multi-Agent Workflow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': 'transparent', 'primaryColor': '#8B5CF6', 'lineColor': '#3B82F6', 'primaryTextColor': '#ffffff', 'nodeBkg': '#0b0b0d', 'clusterBkg': 'transparent', 'edgeLabelBackground': 'transparent', 'sectionBkgColor': 'transparent', 'altSectionBkgColor': 'transparent', 'textColor': '#ffffff', 'fontFamily':'"Inter", Arial, sans-serif', 'stroke': '#3B82F6' }}}%%
graph TB
    User[User] -->|Submits Research Topic| Director[Director Agent]
    Director -->|Generates Queries| Assistant[Assistant Agent]
    Director -->|Scrapes Web Data| Scrapper[Scrapper Agent]
    Director -->|Analyzes Data| DataAnalyzer[Data Analyzer Agent]
    Director -->|Verifies Facts| FactChecker[Fact Checker Agent]
    Director -->|Synthesizes Info| Synthesizer[Synthesizer Agent]
    Director -->|Writes Report| Writer[Writer Agent]
    
    Scrapper -->|Web Content| DataAnalyzer
    DataAnalyzer -->|Insights| Synthesizer
    FactChecker -->|Verified Claims| Synthesizer
    Synthesizer -->|Structured Data| Writer
    Writer -->|Final Report| User
    
    subgraph "Memory Layer"
        Memory[(LibSQL Memory)]
        Vector[(Vector Store)]
    end
    
    Director -.->|Stores Context| Memory
    Assistant -.->|Embeddings| Vector
    Writer -.->|Retrieves| Memory
    
    subgraph "Observability"
        VoltOps[VoltOps Platform]
        Telemetry[(Traces DB)]
    end
    
    Director -.->|Metrics| Telemetry
    Telemetry -.->|Syncs| VoltOps
```


### Tool & Service Integration

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': 'transparent', 'primaryColor': '#8B5CF6', 'lineColor': '#3B82F6', 'primaryTextColor': '#ffffff', 'nodeBkg': '#0b0b0d', 'clusterBkg': 'transparent', 'edgeLabelBackground': 'transparent', 'sectionBkgColor': 'transparent', 'altSectionBkgColor': 'transparent', 'textColor': '#ffffff', 'fontFamily':'"Inter", Arial, sans-serif', 'stroke': '#3B82F6' }}}%%
graph LR
    subgraph "Agents Layer"
        A1[Assistant Agent]
        A2[Writer Agent]
        A3[Director Agent]
        A4[Data Analyzer]
        A5[Fact Checker]
        A6[Synthesizer]
        A7[Scrapper]
    end
    
    subgraph "Tools & Toolkits"
        T1[Reasoning Toolkit]
        T2[Debug Tool]
        T3[ArXiv Toolkit]
        T4[Web Scraper Toolkit]
        T5[Data Conversion Toolkit]
        T6[Filesystem Toolkit]
        T7[Visualization Toolkit]
    end
    
    subgraph "External Services"
        E1[Google AI / Gemini]
        E2[OpenAI]
        E3[MCP]
    end
    
    A1 --> T1
    A1 --> T2
    A3 --> T1
    A4 --> T3
    A4 --> T5
    A4 --> T7
    A7 --> T4
    A7 --> T6
    
    A1 --> E1
    A2 --> E1
    A3 --> E1
    A4 --> E1
    A5 --> E1
    A6 --> E1
    A7 --> E1
    
    A4 --> E2
    A3 --> E3
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Google Generative AI API key (required)
- Supabase account (optional, for A2A task storage)

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

# Optional: For A2A task storage
# SUPABASE_URL='your_supabase_url_here'
# SUPABASE_KEY='your_supabase_key_here'
```

### Running the System

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Interacting with Agents

1. Open the [VoltOps Platform](https://console.voltagent.dev)
2. Navigate to **Workflows** → **Research Assistant Workflow**
3. Submit a research topic:
   - "Latest breakthroughs in quantum computing"
   - "Impact of generative AI on software development"
   - "Advances in sustainable energy storage"
   - "Future of edge computing architectures"

## Agent Capabilities

### Director Agent

**Purpose**: Orchestrates the entire research workflow and coordinates all specialized agents

**Tools**:

- Reasoning Toolkit (think-only mode)

**Key Features**:

- Supervises 6 sub-agents
- Custom handoff guidelines for workflow optimization
- Full stream event forwarding for real-time monitoring
- Lower temperature (0.3) for consistent orchestration decisions

### Assistant Agent

**Purpose**: Generates effective search queries and coordinates research strategy

**Tools**:

- `get_weather` - Example custom tool for weather queries
- Reasoning Toolkit (think-only mode)
- Debug Tool - Context inspection and logging

**Key Features**:

- Query optimization for comprehensive research coverage
- Integration with semantic memory for context-aware queries
- Customizable search strategies via prompt parameters

### Scrapper Agent

**Purpose**: Extracts and collects data from web sources using custom web scraper toolkit

**Tools**: Web Scraper Toolkit with:

- `scrape_webpage_markdown` - Full webpage conversion to clean Markdown
- `extract_code_blocks` - Code extraction with surrounding context
- `extract_structured_data` - Headings, links, tables, lists, metadata
- `extract_text_content` - Clean text extraction
- `batch_scrape_pages` - Recursive batch scraping with depth control

**Key Features**:

- Respects robots.txt and rate limiting
- Graceful error handling with retry logic
- Configurable depth for link following
- Pattern-based URL filtering (include/exclude)
- Markdown output with embedded code blocks

### Data Analyzer Agent

**Purpose**: Analyzes research data, extracts patterns, and generates data-driven insights

**Tools**:

- `analyze_data_patterns` - Pattern, trend, correlation, and anomaly detection
- `extract_key_insights` - Insight extraction with focus areas
- Reasoning Toolkit (think-only mode)
- ArXiv Toolkit:
  - `arxiv_search` - Academic paper search via arXiv API
  - `arxiv_pdf_extract` - PDF text extraction with page limits

**Key Features**:

- Multi-type analysis (patterns, trends, correlations, anomalies)
- Focus-specific insight generation
- Data quality assessment and recommendations
- Lower temperature (0.3) for consistent analysis

### Fact Checker Agent

**Purpose**: Verifies information accuracy, detects bias, and ensures research integrity

**Tools**:

- `verify_claim` - Claim verification with confidence scoring
- `cross_reference_sources` - Multi-source consistency analysis
- `detect_bias` - Bias detection with credibility scoring
- Reasoning Toolkit (think-only mode)

**Key Features**:

- Multi-level confidence ratings (High/Medium/Low)
- Source cross-referencing for consensus detection
- Content-type specific bias analysis (academic, article, report, social media)
- Credibility scoring (0-100 scale)
- Very low temperature (0.2) for factual consistency

### Synthesizer Agent

**Purpose**: Combines multiple research streams, resolves contradictions, creates unified narratives

**Tools**:

- `synthesize_information` - Multi-source integration with theme extraction
- `resolve_contradictions` - Contradiction identification and resolution
- `create_unified_narrative` - Coherent narrative construction
- Reasoning Toolkit (think-only mode)

**Key Features**:

- Thematic integration across sources
- Evidence-based contradiction resolution
- Gap identification and recommendations
- Moderate temperature (0.4) for creative synthesis

### Writer Agent

**Purpose**: Composes comprehensive research reports with citations and structured formatting

**Tools**: None (focused on pure writing and synthesis)

**Key Features**:

- PhD-level academic writing capability
- Quality levels from elementary (10%) to expert (100%)
- Markdown formatting with proper structure
- Citation management with footnote notation
- Tone and style customization
- Comprehensive instructions for research report standards

## Project Structure

```bash
src/
├── index.ts              # VoltAgent initialization & workflow setup
├── agents/               # Multi-agent system
│   ├── assistant.agent.ts     # Query generation (get_weather tool, reasoning)
│   ├── writer.agent.ts        # Report composition
│   ├── director.agent.ts      # Orchestration (reasoning toolkit)
│   ├── data-analyzer.agent.ts # Data analysis (analyze_data_patterns, extract_key_insights, arxiv)
│   ├── fact-checker.agent.ts  # Verification (verify_claim, cross_reference_sources, detect_bias)
│   ├── synthesizer.agent.ts   # Synthesis (synthesize_information, resolve_contradictions, create_unified_narrative)
│   ├── scrapper.agent.ts      # Web scraping (web_scraper_toolkit)
│   └── prompts.ts
├── config/               # Configuration modules
│   ├── logger.ts
│   ├── mcp.ts           # Filesystem & Hugging Face MCP
│   ├── mcpserver.ts
│   ├── google.ts
│   ├── scorers.ts
│   └── supabase.ts
├── tools/                # Custom tools & toolkits
│   ├── reasoning-tool.ts        # Multiple reasoning toolkit variants
│   ├── debug-tool.ts            # Context inspection (log_debug_info)
│   ├── arxiv-toolkit.ts         # arXiv search & PDF extraction
│   ├── web-scraper-toolkit.ts   # Comprehensive web scraping (5 tools)
│   ├── data-conversion-toolkit.ts  # CSV/JSON/XML conversion
│   ├── filesystem-toolkit.ts    # Glob, batch read, file stats
│   └── visualization-toolkit.ts # Excalidraw, SVG, JSON conversion
├── a2a/                  # Agent-to-agent communication
│   ├── server.ts        # A2A server setup
│   └── store.ts         # Supabase-backed task storage
├── workflows/            # Workflow definitions
└── experiments/          # Evaluation experiments
    ├── research-regression.experiment.ts
    ├── synthesis-quality.experiment.ts
    └── scorers/
```

## Development

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test pattern
npm run test -- -t "agent"
```

### Linting & Formatting

```bash
# Lint code
npm run lint
```

### Evaluation

```bash
# Run evaluations
npm run eval
```

## Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **VoltAgent Core** | 1.1.37 | Multi-agent orchestration framework |
| **TypeScript** | 5.9.3 | Type-safe language with strict mode |
| **AI SDK** | 5.0.81 | Multi-model AI provider abstraction |
| **Google AI SDK** | 2.0.24 | Gemini model integration (primary) |
| **OpenAI SDK** | 2.0.53 | GPT model integration (optional) |
| **LibSQL** | 1.0.10 | SQLite-based memory & vector storage |
| **Zod** | 4.1.12 | Runtime schema validation |
| **Vitest** | 4.0.3 | Testing framework |
| **OpenTelemetry** | 0.207.0 | Observability & tracing |
| **Cheerio** | 1.1.2 | HTML parsing for web scraping |
| **JSDOM** | 27.0.1 | DOM simulation |
| **Turndown** | 7.2.2 | HTML to Markdown conversion |
| **fast-xml-parser** | 5.3.0 | XML parsing and building |

## Advanced Features

### Semantic Memory

Each agent maintains persistent memory with semantic search capabilities:

- **Working Memory**: User-scoped context with Zod schemas
- **Vector Storage**: LibSQL-backed embedding storage
- **Semantic Retrieval**: Google text-embedding-004 for similarity search
- **Caching**: Embedding cache for performance optimization (1000 entries, 1 hour TTL)

### A2A Communication

Agents communicate via the A2A (Agent-to-Agent) protocol:

- Message passing between agents
- Shared state management via Supabase task store
- Event broadcasting
- Request/response patterns
- Task persistence and retrieval

### Observability

Full tracing and monitoring via OpenTelemetry:

- Automatic trace collection
- VoltOps platform integration
- LibSQL observability adapter
- Sampling strategies (50% ratio-based)
- Batch export to cloud (512 events per batch, 4-second intervals)

### Workflow Chaining

Type-safe workflow composition with Zod schemas:

```typescript
const workflow = createWorkflowChain({
  id: "research-assistant",
  name: "Research Assistant Workflow",
  purpose: "Comprehensive research automation",
  input: z.object({ topic: z.string() }),
  result: z.object({ text: z.string() }),
})
  .andThen({ id: "research", execute: async ({ data }) => { /* ... */ } })
  .andThen({ id: "writing", execute: async ({ data, getStepData }) => { /* ... */ } })
```

### Custom Tools Overview

#### Web Scraper Toolkit (5 tools)

- Full webpage to Markdown conversion
- Code block extraction with context
- Structured data extraction (headings, links, tables, lists)
- Clean text extraction
- Batch scraping with recursive link following

#### Data Analysis Tools (2 tools)

- Pattern/trend/correlation/anomaly analysis
- Key insight extraction with focus areas

#### Fact Checking Tools (3 tools)

- Claim verification with confidence levels
- Cross-reference analysis for consensus
- Bias detection with credibility scoring

#### Synthesis Tools (3 tools)

- Multi-source information synthesis
- Contradiction resolution with multiple strategies
- Unified narrative creation

#### ArXiv Toolkit (2 tools)

- Academic paper search via arXiv API
- PDF text extraction with page limits

#### Data Conversion Toolkit (4 tools)

- CSV to JSON conversion
- JSON to CSV conversion
- XML parsing
- XML building

#### Filesystem Toolkit (3 tools)

- Glob pattern file finding
- Batch file reading
- File statistics and metadata

#### Visualization Toolkit (4 tools)

- Excalidraw to SVG conversion
- SVG to JSON conversion
- JSON to SVG conversion
- SVG optimization

## Use Cases

- **Academic Research**: Literature review automation, citation management, arXiv integration
- **Market Intelligence**: Competitive analysis, trend identification via web scraping
- **Technical Documentation**: API documentation generation, knowledge base creation
- **Investigative Journalism**: Fact-checking with bias detection, source verification, report compilation
- **Due Diligence**: Company research, risk assessment, compliance verification

## Resources

- **VoltAgent Documentation**: [voltagent.dev/docs](https://voltagent.dev/docs/)
- **VoltOps Platform**: [console.voltagent.dev](https://console.voltagent.dev)
- **Discord Community**: [s.voltagent.dev/discord](https://s.voltagent.dev/discord)
- **Blog**: [voltagent.dev/blog](https://voltagent.dev/blog/)

## Acknowledgments

Built with [VoltAgent](https://voltagent.dev/) - the open-source TypeScript framework for building and orchestrating AI agents.

---

<div align="center">

**[⚡ Powered by VoltAgent](https://voltagent.dev/)**

</div>
