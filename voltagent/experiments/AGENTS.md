# Experiments - AGENTS.md

Evaluation experiments for the Mastervolt Deep Research multi-agent system.

I only plan use live evals for now also no openai all agents use.... google useless shit moron

## Structure

- `*.experiment.ts` - Offline evaluation experiments using VoltAgent's `@voltagent/evals`
- `scorers/` - Custom scorer implementations for research evaluation
- `live-eval.config.ts` - Live evaluation configuration for production monitoring must use google

## Available Experiments

### research-regression.experiment.ts

Daily regression test suite for the multi-agent research orchestration system.

- Tests director, assistant, writer agents
- 5+ research topics with expected outputs
- Scorers: comprehensiveness, structure, synthesis quality, string similarity
- Pass criteria: 80% pass rate, 65% mean score

### synthesis-quality.experiment.ts

Integration test for synthesis agent multi-source information integration.

- Tests synthesizer agent on conflicting/complementary information
- 3+ synthesis scenarios
- Scorers: synthesis quality, data accuracy
- Pass criteria: 75% pass rate, 60% mean score

## Running Experiments

### Offline (CLI)

```bash
npm run volt eval run --experiment ./src/experiments/research-regression.experiment.ts
npm run volt eval run --experiment ./src/experiments/synthesis-quality.experiment.ts
```

### Offline (Programmatic)

```typescript
import { runExperiment } from '@voltagent/evals'
import researchExperiment from './src/experiments/research-regression.experiment'

const result = await runExperiment(researchExperiment, {
  concurrency: 2,
  onProgress: ({ completed, total }) => console.log(`${completed}/${total}`)
})
```

### Live Evaluation

Attach to agents in agent config:

```typescript
import { liveEvalConfig } from './experiments/live-eval.config'

export const myAgent = new Agent({
  // ...
  eval: liveEvalConfig
})
```

## Custom Scorers

All custom scorers in `scorers/research-scorers.ts`:

1. **researchComprehensiveScorer** - Evaluates research depth, breadth, structure
2. **dataAccuracyScorer** - Validates data extraction against expected patterns
3. **synthesisQualityScorer** - Checks synthesis quality indicators
4. **factCheckingScorer** - Verifies factual claims
5. **reportStructureScorer** - Validates markdown formatting and organization

Scorers use the 4-step VoltAgent scorer pipeline: prepare → analyze → score → reason

## Datasets

Datasets stored in `datasets/` folder:

- `research-topics.json` - 8 research topics for regression testing

## Integration with VoltOps

When VoltOps credentials configured:
THIS IS WRONG
```bash
VOLTAGENT_PUBLIC_KEY=xxx VOLTAGENT_SECRET_KEY=yyy \
npm run volt eval run --experiment ./src/experiments/research-regression.experiment.ts
```

Results automatically:

- Created as VoltOps runs
- Tagged with experiment metadata
- Accessible in VoltOps Console
- Comparable across runs

## Development

### Add New Experiment

1. Create `new-feature.experiment.ts`
2. Define dataset with items (input, expected)
3. Implement runner calling relevant agent
4. Add scorers from `scorers/research-scorers.ts`
5. Define pass criteria
6. Export as default from `createExperiment()`

### Add Custom Scorer

1. Implement in `scorers/research-scorers.ts`
2. Use 4-step pipeline: prepare → analyze → score → reason
3. Export as named export
4. Use in experiments via import

## Notes

- All experiments use Google Gemini (not OpenAI)
- Live evals sample 10% in production, 100% in staging
- Custom scorers use `unknown` types to avoid `any` in strict mode
- Datasets are JSON files - push to VoltOps for cloud storage
