import { createExperiment } from '@voltagent/evals'
import { scorers } from '@voltagent/scorers'
import { synthesizerAgent } from '../agents/synthesizer.agent.js'
import {
  synthesisQualityScorer,
  dataAccuracyScorer
} from './scorers/research-scorers.js'

export default createExperiment({
  id: 'synthesis-quality',
  label: 'Information Synthesis Quality',
  description: 'Evaluates synthesis agent quality on multi-source information integration',

  dataset: {
    items: [
      {
        id: 'synthesis-1',
        input: JSON.stringify({
          sources: [
            'Solar energy efficiency has improved 15% over the last 5 years',
            'Wind power capacity grew by 20% annually',
            'Battery storage costs decreased by 50% since 2019'
          ],
          topic: 'renewable energy trends'
        }),
        expected: 'Should integrate renewable energy improvements, identify trends, acknowledge cost reductions'
      },
      {
        id: 'synthesis-2',
        input: JSON.stringify({
          sources: [
            'AI diagnostic tools show 94% accuracy in cancer detection',
            'Some studies report 89% accuracy in certain cancer types',
            'Clinical adoption remains limited due to regulatory challenges'
          ],
          topic: 'AI in healthcare diagnostics'
        }),
        expected: 'Should synthesize accuracy claims, resolve discrepancies, mention adoption barriers'
      },
      {
        id: 'synthesis-3',
        input: JSON.stringify({
          sources: [
            'Blockchain provides immutable transaction records',
            'Supply chain tracking via blockchain increased visibility',
            'Some implementations faced scalability issues'
          ],
          topic: 'blockchain in supply chain'
        }),
        expected: 'Should combine benefits with challenges, create coherent narrative'
      }
    ]
  },

  runner: async ({ item }) => {
    try {
      const result = await synthesizerAgent.generateText(item.input)
      return {
        output: result.text || 'No synthesis generated',
        metadata: {
          tokens: result.usage?.totalTokens || 0
        }
      }
    } catch (error) {
      return {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: true }
      }
    }
  },

  scorers: [
    {
      scorer: synthesisQualityScorer,
      threshold: 0.6,
      id: 'synthesis-quality'
    },
    {
      scorer: dataAccuracyScorer,
      threshold: 0.5,
      id: 'data-accuracy'
    },
    {
      scorer: scorers.levenshtein,
      threshold: 0.4,
      id: 'string-similarity'
    }
  ],

  passCriteria: [
    {
      type: 'passRate',
      min: 0.75,
      scorerId: 'synthesis-quality',
      label: 'Synthesis quality must pass 75% of cases'
    },
    {
      type: 'meanScore',
      min: 0.6,
      label: 'Average synthesis score must be 60%'
    }
  ],

  tags: ['synthesis', 'rag', 'quality', 'integration'],
  metadata: {
    version: '1.0.0',
    testType: 'integration',
    focus: 'multi-source synthesis'
  }
})
