import { createExperiment } from '@voltagent/evals'
import { scorers } from '@voltagent/scorers'
import { directorAgent } from '../agents/director.agent.js'
import {
  researchComprehensiveScorer,
  synthesisQualityScorer,
  reportStructureScorer
} from './scorers/research-scorers.js'

interface ResearchItem {
  id: string;
  input: string;
  expected: string;
}

export default createExperiment({
  id: 'research-regression',
  label: 'Research System Regression',
  description: 'Comprehensive offline evaluation of the multi-agent research system',

  dataset: {
    items: [
      {
        id: 'research-1',
        input: 'Research quantum computing fundamentals and applications',
        expected: 'Research should cover quantum principles, quantum gates, current applications, and future potential'
      },
      {
        id: 'research-2',
        input: 'Analyze blockchain technology in supply chain management',
        expected: 'Should discuss distributed ledgers, smart contracts, transparency, traceability, and current use cases'
      },
      {
        id: 'research-3',
        input: 'Explore machine learning ethics and bias mitigation',
        expected: 'Should cover algorithmic bias, fairness definitions, detection methods, and mitigation strategies'
      },
      {
        id: 'research-4',
        input: 'Investigate climate change adaptation strategies',
        expected: 'Should include infrastructure resilience, ecosystem adaptation, policy responses, and community preparedness'
      },
      {
        id: 'research-5',
        input: 'Research artificial intelligence in healthcare diagnostics',
        expected: 'Should discuss AI diagnostic tools, accuracy improvements, regulatory challenges, and patient privacy'
      }
    ]
  },

  runner: async ({ item }: { item: ResearchItem }) => {
    try {
      const result = await directorAgent.generateText(item.input)
      return {
        output: result.text || 'No output generated',
        metadata: {
          tokens: result.usage?.totalTokens ?? 0,
          duration: Date.now()
        }
      }
    } catch (error) {
      return {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          error: true
        }
      }
    }
  },

  scorers: [
    {
      scorer: researchComprehensiveScorer,
      threshold: 0.6
    },
    {
      scorer: reportStructureScorer,
      threshold: 0.5
    },
    {
      scorer: synthesisQualityScorer,
      threshold: 0.5
    },
    {
      scorer: scorers.levenshtein,
      threshold: 0.4
    }
  ],

  passCriteria: [
    {
      type: 'passRate',
      min: 0.8,
      label: 'At least 80% of research items must pass'
    },
    {
      type: 'meanScore',
      min: 0.65,
      label: 'Average research quality score must be 65%'
    }
  ],

  tags: ['regression', 'research', 'quality', 'daily'],
  metadata: {
    version: '1.0.0',
    frequency: 'daily',
    environment: 'ci'
  }
})
