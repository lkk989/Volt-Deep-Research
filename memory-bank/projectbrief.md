# Project Brief: Mastervolt Deep Research

## Overview

**Mastervolt Deep Research** is an enterprise-grade multi-agent research system built on VoltAgent v2 that automates complex research workflows through intelligent agent orchestration with 14+ specialized agents, 28+ toolkits, and comprehensive security guardrails.

## Core Requirements

### Primary Goals

1. **Automated Research** - Conduct comprehensive research on any topic
2. **Multi-Agent Orchestration** - Coordinate 14+ specialized AI agents
3. **Fact Verification** - Verify claims with confidence scoring & bias detection
4. **Report Generation** - Produce PhD-level research reports with citations
5. **Security** - Input/output guardrails for enterprise safety

### Key Deliverables

- PlanAgent-supervised agent coordination system (100 max steps)
- Semantic memory with LibSQL vector storage
- Custom web scraping toolkit (Cheerio, JSDOM, Turndown)
- Financial data toolkits (stocks, crypto, Alpha Vantage)
- PDF processing & OCR (Tesseract.js, unpdf)
- GitHub integration toolkit
- Fact-checking with bias detection & credibility scoring
- Publication-ready report generation
- VoltAgent v2 guardrails (PII, profanity, prompt injection)
- A2A communication protocol
- OpenTelemetry observability with VoltOps

## Scope

### In Scope

- Multi-agent workflow orchestration
- Web scraping and data collection
- ArXiv academic paper integration
- Stock/crypto market data (Yahoo, Stooq, Binance - no API key)
- Alpha Vantage financial data
- PDF extraction, metadata, OCR
- Data analysis and pattern detection
- Fact verification and bias detection
- Information synthesis with contradiction resolution
- Report composition with citations
- A2A (Agent-to-Agent) communication
- OpenTelemetry observability
- VoltAgent v2 Guardrails (input/output filtering)
- GitHub integration (repos, issues, PRs, code search)
- RAG toolkit with multiple vector stores
- Knowledge graph generation

### Out of Scope

- Real-time collaborative editing
- Payment processing
- Mobile application
- User authentication (planned)

## Success Criteria

1. Successfully execute end-to-end research workflows
2. Generate accurate, well-cited research reports
3. Maintain agent context across workflow steps
4. Achieve < 3s response time for simple queries
5. 95%+ test coverage on critical paths
6. Pass security audits with guardrails

## Timeline

- **Phase 1**: Core agent framework ✅
- **Phase 2**: Tool development (28+ toolkits) ✅
- **Phase 3**: Workflow orchestration ✅
- **Phase 4**: Observability & production readiness ✅
- **Phase 5**: Security & guardrails ✅
- **Phase 6**: Evaluation & testing 🔄

---

\*Last Updated: 2026-02-14
