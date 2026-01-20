# AGENTS.md - src/workflows

Workflow definitions and orchestration pipelines.

## Available Workflows

| ID                                | Purpose                  | Agent Chain                                                               |
| :-------------------------------- | :----------------------- | :------------------------------------------------------------------------ |
| `comprehensive-research`          | Main sequential pipeline | Assistant -> Scrapper -> Analyzer -> FactChecker -> Synthesizer -> Writer |
| `research-assistant-demo`         | Lightweight smoke test   | Assistant -> Writer                                                       |
| `comprehensive-research-director` | Dynamic orchestration    | Director (Master)                                                         |
| `data-pattern-analyzer`           | Input diagnostics        | DataAnalyzer                                                              |

## Patterns

- **Validation**: Every workflow must have Zod-defined `input` and `result` schemas.
- **Context**: Access previous step results via `getStepData(id)`.
- **Sequential**: Use `.andThen()` for step chaining.
