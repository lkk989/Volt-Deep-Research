---
applyTo: './src/tools/**, ./src/agents/**'
description: 'Comprehensive toolkit and tool guidelines for Mastervolt project'
---
# Toolkits and Tools

**Mastervolt** implements a comprehensive toolkit ecosystem with specialized tools for web scraping, reasoning, data analysis, fact-checking, and synthesis operations.

## Web Scraper Toolkit (src/tools/web-scraper-toolkit.ts)

**Primary toolkit for web data extraction with 5 specialized tools:**

### Core Scraping Tools

- **`scrape_webpage_markdown`**: Full webpage to clean Markdown conversion
  - Uses JSDOM/Cheerio/TurndownService pipeline
  - Removes scripts, navigation, preserves structure
  - Optional image inclusion, content length limits
  - Returns: markdown, contentLength, scrapedAt timestamp

- **`extract_code_blocks`**: Code extraction with context and language detection
  - Detects language from class attributes (language-*)
  - Configurable context lines (1-20, default 3)
  - Extracts from `<pre>` and `<code>` elements
  - Returns: language, code, context, filename, indices

- **`extract_structured_data`**: Comprehensive page structure analysis
  - Metadata: title, description, keywords, author
  - Headings: H1-H6 with levels and indices
  - Links: href, text, title attributes
  - Tables: headers, rows with validation
  - Lists: ordered/unordered with item counts

- **`extract_text_content`**: Clean text extraction
  - Removes HTML, scripts, styles, navigation
  - Configurable whitespace cleaning
  - Focuses on main content areas
  - Returns: clean text, length, timestamp

### Advanced Batch Operations

- **`batch_scrape_pages`**: Multi-page scraping with depth control
  - Max 50 starting URLs, 5 depth levels, 100 total pages
  - Recursive link following with domain restrictions
  - Include/exclude regex patterns
  - Rate limiting (100-5000ms delays)
  - Returns: Markdown + embedded code blocks per page

## Reasoning Toolkit (src/tools/reasoning-tool.ts)

**Internal reasoning capabilities:**

- **`thinkOnlyToolkit`**: Structured thinking and analysis
- Used by: assistantAgent, directorAgent, dataAnalyzerAgent, factCheckerAgent, synthesizerAgent
- Enables internal reasoning without external API calls

## Agent-Specific Tools

### Assistant Agent Tools

- **`get_weather`**: Demo weather tool for location queries
  - Simple location-based weather responses
  - Used for testing tool integration patterns

### Data Analyzer Tools

- **`analyze_data_patterns`**: Pattern, trend, correlation, anomaly analysis
  - Analysis types: patterns, trends, correlations, anomalies
  - Returns structured findings with quantified results
  - Validates data size, identifies repeated elements

- **`extract_key_insights`**: Actionable information extraction
  - Focus-based insight generation
  - Identifies actionable items, recommendations
  - Returns keyPoints, actionableItems, recommendations

### Fact Checker Tools

- **`verify_claim`**: Claim accuracy verification
  - Status levels: Verified, Partially Verified, Unverified, Debunked
  - Confidence: High, Medium, Low
  - Pattern-based verification with reasoning chains

- **`cross_reference_sources`**: Multi-source consistency analysis
  - Consistency levels: High, Medium, Low, Conflicting, Unknown
  - Common theme extraction, conflict detection
  - Consensus point identification

- **`detect_bias`**: Bias and misinformation detection
  - Content types: article, report, social_media, academic
  - Credibility scoring (0-100), risk levels
  - Bias indicators: sensationalism, anonymous sources, conspiracy language

### Synthesizer Tools

- **`synthesize_information`**: Multi-source information integration
  - Theme extraction, consensus identification
  - Gap analysis, integrated insights generation
  - Recommendation generation based on synthesis

- **`resolve_contradictions`**: Contradiction resolution
  - Resolution approaches: Majority Rule, Recency, Authority, Evidence-Based, Synthesis
  - Contradiction pattern detection
  - Confidence assessment for resolutions

- **`create_unified_narrative`**: Coherent narrative creation
  - Narrative structure: introduction, main points, connections, conclusion
  - Coherence assessment: High, Medium, Low
  - Theme identification and gap analysis

## Tool Development Standards

### Implementation Requirements

- **Context Checking**: All tools MUST check `context?.isActive` before execution
- **Error Handling**: Throw descriptive errors with operation context
- **Logging**: Use voltlogger from src/config/logger.js throughout
- **Naming**: snake_case for tool names, kebab-case for files
- **Validation**: Zod schemas for all parameters

### Operational Patterns

- **Timeout Handling**: 30-second timeouts for external requests
- **Rate Limiting**: Respectful delays between requests (1000ms default)
- **User-Agent**: Standard browser user-agent strings
- **Error Recovery**: Graceful failures with informative messages

### Quality Assurance

- **Input Validation**: Comprehensive parameter validation
- **Output Structure**: Consistent return formats with timestamps
- **Performance Monitoring**: Operation timing and success tracking
- **Resource Management**: Memory and connection cleanup
