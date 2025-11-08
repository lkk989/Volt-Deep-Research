# Mastervolt Deep Research Workflows

This document lists the primary workflows implemented in `src/workflows` and registered in `src/index.ts`. Use it as the source of truth for how to invoke each workflow via VoltAgent / VoltOps.

---

## research-assistant-demo

- id: research-assistant-demo
- Purpose / When to use:
  - Simple demo workflow for quick research assistance on a single topic.
  - Good for smoke tests, examples, and lightweight exploratory usage.
- Key agents/tools:
  - `assistantAgent` for generating search queries and initial context.
  - `writerAgent` for producing a short, sourced research-style report.
- Notes:
  - Demo-level workflow, not the primary deep research pipeline.
  - Minimal orchestration and quality controls compared to other flows.

---

## comprehensive-research

- id: comprehensive-research
- Purpose / When to use:
  - Canonical, sequential multi-agent pipeline for end-to-end deep research.
  - Covers query generation → web data gathering → analysis → fact-checking → synthesis → final report.
- Key agents/tools:
  - `assistantAgent` → `scrapperAgent` → `dataAnalyzerAgent` → `factCheckerAgent` → `synthesizerAgent` → `writerAgent`.
  - Uses `voltlogger` for step-level logging.
- Notes:
  - Primary production-style workflow.
  - Deterministic sequence; no dynamic re-planning.

---

## comprehensive-research-director

- id: comprehensive-research-director
- Purpose / When to use:
  - Advanced workflow where `directorAgent` orchestrates specialized agents.
  - Dynamically plans which agents to use and in what order for comprehensive research.
- Key agents/tools:
  - `directorAgent` as meta-orchestrator.
  - May delegate to: `assistantAgent`, `scrapperAgent`, `dataAnalyzerAgent`, `factCheckerAgent`, `synthesizerAgent`, `writerAgent`.
  - Uses `voltlogger` and observability hooks for richer tracing.
- Notes:
  - Advanced / experimental orchestration workflow.
  - Suitable for complex, adaptive research scenarios.

---

## data-pattern-analyzer

- id: data-pattern-analyzer
- Purpose / When to use:
  - Analyze an input text for patterns, trends, anomalies, and basic metrics.
  - Ideal for quickly understanding structure and signal in arbitrary text blobs.
- Key agents/tools:
  - `dataAnalyzerAgent` for semantic analysis.
  - Deterministic metrics computed in-workflow (characters, words, lines, sentences).
- Notes:
  - Utility workflow focused on input diagnostics rather than full research.
  - Stable, deterministic output shape for downstream integrations.

---

## fact-check-synthesis

- id: fact-check-synthesis
- Purpose / When to use:
  - Given a topic, claims, and sources, performs structured fact-checking and synthesizes a concise narrative.
  - Produces an overall risk level to guide decision-makers.
- Key agents/tools:
  - `factCheckerAgent` for detailed evidence-based verification.
  - `synthesizerAgent` for coherent narrative synthesis.
- Notes:
  - Specialized workflow; complementary to the comprehensive research flows.
  - Designed for reliability, transparency, and clear risk assessment.
