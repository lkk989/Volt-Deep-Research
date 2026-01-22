import { Agent, buildScorer } from "@voltagent/core";
import { z } from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";

export const judgeAgent = new Agent({
  id: "satisfaction-judge",
  name: "satisfaction-judge",
  purpose: "Judge user satisfaction based on input and output.",
  instructions: "Return JSON with score (0-1), label, and optional reason.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "github-copilot";
    const model = (context.get("model") as string) || "grok-code-fast-1";
    return `${provider}/${model}`;
  },
  tools: [],
  maxOutputTokens: 64000,
  temperature: 0.3,
  logger: voltlogger,
  observability: voltObservability,
});

const judgeSchema = z.object({
  score: z.number().min(0).max(1),
  label: z.string(),
  reason: z.string().optional(),
});

export const satisfactionScorer = buildScorer({
  id: "satisfaction-judge",
  label: "Satisfaction Judge",
})
  .score(async ({ payload }) => {
    const prompt = `Score user satisfaction (0-1) and label it.
User: ${String(payload.input)}
Assistant: ${String(payload.output)}`;
    const response = await judgeAgent.generateObject(prompt, judgeSchema);
    return {
      score: response.object.score,
      metadata: {
        label: response.object.label,
        reason: response.object.reason ?? null,
      },
    };
  })
  .build();

export const supportAgent = new Agent({
  id: "support-agent",
  name: "support-agent",
  purpose: "Support Agent to assist users with their inquiries and issues.",
  instructions: "You are a support agent.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "github-copilot";
    const model = (context.get("model") as string) || "grok-code-fast-1";
    return `${provider}/${model}`;
  },
  tools: [],
  toolkits: [],
  maxOutputTokens: 64000,
  memory: sharedMemory,
  temperature: 0.3,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
  eval: {
    scorers: {
      satisfaction: {
        scorer: satisfactionScorer,
        onResult: async ({ result, feedback }) => {
          await feedback.save({
            traceId: "satisfaction-judge",
            key: "satisfaction",
            value: (result.metadata?.label as string) ?? null,
            score: result.score ?? null,
            comment: (result.metadata?.reason as string) ?? null,
            feedbackSource: {
              "type": "agent",
            },
            feedbackSourceType: "model",
            createdAt: new Date().toISOString(),
          });
        },
      },
    }
  },
});
