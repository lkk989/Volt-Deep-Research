# Workflows and Experiments

**Mastervolt** implements a production-grade workflow system with comprehensive experimental evaluation framework for continuous quality assurance.

## Primary Workflow: Research Assistant (src/index.ts)

### Workflow Configuration

- **ID**: "research-assistant"
- **Name**: "Research Assistant Workflow"
- **Purpose**: "A simple workflow to assist with research on a given topic"
- **Input Schema**: `{ topic: string }` (Zod validated)
- **Output Schema**: `{ text: string }` (Zod validated)

### Two-Step Research Pipeline

#### Step 1: Research Query Generation

- **ID**: "research"
- **Agent**: assistantAgent
- **Task**: Generate 3 diverse search queries for comprehensive research coverage
- **Input**: User-provided topic
- **Output**: `{ text: string, input: topic }` (search queries + original topic)
- **Prompt Strategy**: "Generate a list of 3 search queries... Do not add any formatting or numbering"

#### Step 2: Report Synthesis

- **ID**: "writing"
- **Agent**: writerAgent
- **Task**: Create structured two-paragraph research report with citations
- **Input**: Search queries from Step 1 + original topic via `getStepData("research")`
- **Output**: `{ text: string }` (final report)
- **Citation Format**: Footnote notation ([#]) with References section
- **Requirements**: "Include as many sources as possible... followed by a single 'References' section"

## Experimental Evaluation Framework

### Research Regression Experiment (src/experiments/research-regression.experiment.ts)

**Comprehensive offline evaluation of the multi-agent research system**

#### Configuration

- **ID**: 'research-regression'
- **Label**: 'Research System Regression'
- **Agent Under Test**: directorAgent (full multi-agent orchestration)
- **Frequency**: Daily CI/CD integration
- **Environment**: Continuous integration

#### Test Dataset (5 Research Scenarios)

1. **Quantum Computing**: "Research quantum computing fundamentals and applications"
   - Expected: quantum principles, gates, applications, future potential

2. **Blockchain Supply Chain**: "Analyze blockchain technology in supply chain management"
   - Expected: distributed ledgers, smart contracts, transparency, traceability

3. **ML Ethics**: "Explore machine learning ethics and bias mitigation"
   - Expected: algorithmic bias, fairness definitions, detection, mitigation

4. **Climate Adaptation**: "Investigate climate change adaptation strategies"
   - Expected: infrastructure resilience, ecosystem adaptation, policy responses

5. **AI Healthcare**: "Research artificial intelligence in healthcare diagnostics"
   - Expected: AI diagnostic tools, accuracy, regulatory challenges, privacy

#### Scoring System (4 Scorers)

- **researchComprehensiveScorer**: Structure (3+ sections), length (500+ words), references (threshold: 0.6)
- **reportStructureScorer**: Document organization and formatting (threshold: 0.5)
- **synthesisQualityScorer**: Information integration quality (threshold: 0.5)
- **scorers.levenshtein**: Text similarity baseline (threshold: 0.4)

#### Pass Criteria

- **Pass Rate**: Minimum 80% of research items must pass all thresholds
- **Mean Score**: Average research quality score must be ≥65%

### Custom Research Scorers (src/experiments/scorers/research-scorers.ts)

#### researchComprehensiveScorer

- **Structure Validation**: Minimum 3 distinct sections
- **Length Requirements**: 500+ words for comprehensive coverage
- **Reference Validation**: Presence of citations and references
- **Scoring**: Composite score based on structure, depth, and sourcing

#### synthesisQualityScorer

- **Multi-Source Integration**: Evaluation of information synthesis
- **Contradiction Resolution**: Assessment of conflicting information handling
- **Coherence**: Narrative flow and logical progression

#### reportStructureScorer

- **Document Organization**: Heading hierarchy and section structure
- **Formatting**: Markdown compliance and readability
- **Professional Standards**: Academic/professional report formatting

## Development & Evaluation Commands

### Development Workflow

```bash
npm run dev          # tsx watch with .env loading for development
npm start           # Production server from compiled dist/
npm run build       # TypeScript compilation to dist/
```

### Evaluation & Testing

```bash
npm run eval        # Run experimental evaluations with viteval
npx vitest run      # Execute test suite
npx vitest --watch  # Development testing with watch mode
```

### Quality Assurance

```bash
npm run lint        # ESLint with caching
npm run test        # Full test suite with coverage
```

## Workflow Integration

### VoltOps Platform Integration

- **Console**: <https://console.voltagent.dev>
- **Workflow Discovery**: "Research Assistant Workflow" appears in platform
- **Interactive Execution**: Click-to-run with topic input
- **Monitoring**: Real-time execution tracking and metrics

### A2A Server Integration

- **Port**: 3141 (Hono server)
- **Agent Communication**: Inter-agent task coordination
- **State Management**: Supabase-backed task store
- **Service Name**: "support-agent"

### Observability & Monitoring

- **Sampling**: 50% of operations traced
- **Batch Size**: 512 events per batch
- **Flush Interval**: 4 seconds
- **Storage**: LibSQL (.voltagent/observability.db)
- **Metrics**: Token usage, execution time, success rates
