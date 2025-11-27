import { google } from "@ai-sdk/google";
import { buildScorer } from "@voltagent/core";
import { createAnswerCorrectnessScorer } from "@voltagent/scorers";
import { generateObject } from "ai";
import { z } from "zod";

export const scorer = createAnswerCorrectnessScorer({
  buildPayload: (context) => ({
    input: context.payload.input as string,
    output: context.payload.output as string,
    expected: context.params.expectedAnswer as string,
  }),
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
});

const JUDGE_SCHEMA = z.object({
  score: z.number().min(0).max(1).describe("Score from 0 to 1"),
  reason: z.string().describe("Detailed explanation"),
});

export const helpfulnessScorer = buildScorer({
  id: "helpfulness",
  label: "Helpfulness Judge",
})
  .score(async ({ payload }) => {
    const prompt = `Rate the response for clarity and helpfulness.

User Input: ${payload.input}
Assistant Response: ${payload.output}

Provide a score from 0 to 1 with an explanation.`;

    const response = await generateObject({
      model: google("gemini-2.5-flash-lite-preview-09-2025"),
      schema: JUDGE_SCHEMA,
      prompt,
      maxOutputTokens: 1000,
    });

    return {
      score: response.object.score,
      metadata: {
        reason: response.object.reason,
      },
    };
  })
  .build();
