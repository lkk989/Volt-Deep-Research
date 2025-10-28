---
inclusion: always
---

# Agent System

**Mastervolt** implements a sophisticated 7-agent research ecosystem with specialized roles, advanced memory management, and comprehensive tool integration.

## Agent Architecture (7 Specialized Agents)

### 1. assistantAgent (Query Generation & Coordination)

- **Purpose**: Generate effective search queries and coordinate research tasks
- **Model**: gemini-2.5-flash-lite-preview-09-2025
- **Temperature**: 0.7 (creative query generation)
- **Tools**: `get_weather` (demo tool), thinkOnlyToolkit (reasoning)
- **Memory**: assistant-memory.db with user profile schema
- **Specialization**: Research query formulation, search coordination

### 2. writerAgent (Report Synthesis & Composition)

- **Purpose**: Write comprehensive reports with 15+ years expertise simulation
- **Model**: gemini-2.5-flash-preview-09-2025 (higher capability)
- **Temperature**: Default (balanced creativity/consistency)
- **Max Steps**: 50 (extended for complex writing)
- **Output**: Markdown-formatted reports with structured sections
- **Quality Levels**: PhD (10k-30k words), Master's (3k-10k), Bachelor's (1k-3k)
- **Specialization**: Academic-level report writing, citation formatting

### 3. directorAgent (Multi-Agent Orchestration)

- **Purpose**: Orchestrate comprehensive research projects using specialized agents
- **Model**: gemini-2.5-flash-lite-preview-09-2025
- **Temperature**: 0.3 (consistent orchestration decisions)
- **Max Steps**: 30 (complex multi-agent workflows)
- **Sub-Agents**: All 6 other agents under supervision
- **Workflow**: Assistant → Scrapper → DataAnalyzer → FactChecker → Synthesizer → Writer
- **Specialization**: Research workflow management, agent delegation

### 4. dataAnalyzerAgent (Pattern Analysis & Insights)

- **Purpose**: Analyze research data, extract patterns and insights
- **Model**: gemini-2.5-flash-lite-preview-09-2025
- **Temperature**: 0.3 (consistent analytical approach)
- **Tools**: `analyze_data_patterns`, `extract_key_insights`, thinkOnlyToolkit
- **Analysis Types**: patterns, trends, correlations, anomalies
- **Output**: Structured markdown with quantified findings
- **Specialization**: Data-driven conclusions, evidence-based analysis

### 5. factCheckerAgent (Verification & Bias Detection)

- **Purpose**: Verify information accuracy, detect bias, ensure research integrity
- **Model**: gemini-2.5-flash-lite-preview-09-2025
- **Temperature**: 0.2 (maximum factual consistency)
- **Tools**: `verify_claim`, `cross_reference_sources`, `detect_bias`, thinkOnlyToolkit
- **Verification Levels**: High (95%+), Medium (70-94%), Low (<70%)
- **Content Types**: article, report, social_media, academic
- **Specialization**: Source verification, bias analysis, credibility scoring

### 6. synthesizerAgent (Information Integration)

- **Purpose**: Combine multiple research streams, resolve contradictions
- **Model**: gemini-2.5-flash-lite-preview-09-2025
- **Temperature**: 0.4 (moderate creativity for synthesis)
- **Tools**: `synthesize_information`, `resolve_contradictions`, `create_unified_narrative`
- **Resolution Methods**: Majority Rule, Recency, Authority, Evidence-Based, Synthesis
- **Output**: Unified narratives with coherence assessment
- **Specialization**: Multi-source integration, contradiction resolution

### 7. scrapperAgent (Web Data Extraction)

- **Purpose**: Extract and collect data from web sources for research
- **Model**: gemini-2.5-flash-lite-preview-09-2025
- **Temperature**: 0.3 (consistent extraction approach)
- **Toolkit**: webScraperToolkit (5 specialized tools)
- **Capabilities**: Markdown conversion, code extraction, structured data, batch scraping
- **Ethics**: Respects robots.txt, rate limiting, terms of service
- **Specialization**: Web content extraction, data collection

## Shared Agent Configuration

### Memory Architecture

- **Storage**: LibSQL per-agent databases (.voltagent/{agent-id}-memory.db)
- **Vector Store**: Shared LibSQL vector store (.voltagent/memory.db)
- **Embeddings**: Google text-embedding-004 with caching enabled
- **Working Memory**: User-scoped with profile, preferences, goals schema
- **Cache**: 1000 embeddings, 1-hour TTL, enabled across all agents

### Model Configuration

- **Primary Model**: gemini-2.5-flash-lite-preview-09-2025 (6 agents)
- **Enhanced Model**: gemini-2.5-flash-preview-09-2025 (writer only)
- **Max Output Tokens**: 64,000 (all agents)
- **Max Steps**: 25 (standard), 30 (director), 50 (writer)
- **Max History**: 100 entries per agent

### Operational Hooks

- **Lifecycle**: onStart, onEnd with operation ID tracking
- **Tool Monitoring**: onToolStart, onToolEnd with error logging
- **Message Processing**: onPrepareMessages for preprocessing
- **Handoff Tracking**: onHandoff for agent-to-agent transitions (director)

### Logging & Observability

- **Logger**: voltlogger (Pino-based, trace level)
- **Operation IDs**: UUID tracking across agent operations
- **Error Handling**
