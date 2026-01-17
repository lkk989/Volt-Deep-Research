import { buildScorer } from '@voltagent/core'
import { google } from "@ai-sdk/google";
import { generateObject } from 'ai';
import { z } from 'zod';

const GOOGLE_QUALITY_SCHEMA = z.object({
  score: z.number().min(0).max(1).describe("Quality score"),
  reason: z.string().describe("Explanation"),
})

export const liveQualityScorer = buildScorer({
  id: 'live-output-quality',
  label: 'Live Output Quality'
})
  .score(async ({ payload }) => {
    const prompt = `Rate the quality of this assistant response on a scale from 0 to 1. 1 means high quality, well-structured, informative. 0 means poor quality.
Response: ${String(payload.output)}
Provide score and reason.`

    const response = await generateObject({
      model: google("gemini-2.5-flash-lite-preview-09-2025"),
      prompt,
      schema: GOOGLE_QUALITY_SCHEMA,
    })

    return {
      score: response.object.score,
      metadata: {
        reason: response.object.reason
      }
    }
  })
  .reason(({ results }) => {
    const metadata = results.raw as unknown as { reason?: string }
    return {
      reason: metadata?.reason ?? 'No explanation.'
    }
  })
  .build()

const GOOGLE_RELEVANCE_SCHEMA = z.object({
  score: z.number().min(0).max(1).describe("Relevance score"),
  reason: z.string().describe("Explanation"),
})

export const liveRelevanceScorer = buildScorer({
  id: 'live-relevance',
  label: 'Live Relevance'
})
  .score(async ({ payload }) => {
    const prompt = `Rate how relevant this assistant response is to the user input on a scale from 0 to 1. 1 means highly relevant, 0 means not relevant.
User Input: ${String(payload.input)}
Response: ${String(payload.output)}
Provide score and reason.`

    const response = await generateObject({
      model: google("gemini-2.5-flash-lite-preview-09-2025"),
      prompt,
      schema: GOOGLE_RELEVANCE_SCHEMA,
    })

    return {
      score: response.object.score,
      metadata: {
        reason: response.object.reason
      }
    }
  })
  .reason(({ results }) => {
    const metadata = results.raw as unknown as { reason?: string }
    return {
      reason: metadata?.reason ?? 'No explanation.'
    }
  })
  .build()

export const liveEvalConfig = {
  triggerSource: 'production' as const,
  environment: process.env.NODE_ENV === 'production' ? 'prod' : 'staging',
  sampling: {
    type: 'ratio' as const,
    rate: process.env.NODE_ENV === 'production' ? 0.1 : 1
  },
  scorers: {
    quality: {
      scorer: liveQualityScorer,
      sampling: { type: 'ratio' as const, rate: 1 }
    },
    relevance: {
      scorer: liveRelevanceScorer,
      sampling: { type: 'ratio' as const, rate: 0.5 }
    }
  },
  redact: (payload: Record<string, unknown>) => ({
    ...payload,
    input: String(payload.input).replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[EMAIL]'),
    output: String(payload.output).replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[CARD]')
  })
}
