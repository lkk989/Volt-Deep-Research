import { Agent, buildScorer } from "@voltagent/core";
import { z } from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { sharedWorkspaceFilesystemToolkit, sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from "../workspaces/index.js";
import { judgePrompt, supportPrompt } from "./prompts.js";

export const judgeAgent = new Agent({
  id: "satisfaction-judge",
  name: "satisfaction-judge",
  purpose: "Score response quality and user satisfaction signals to support feedback-driven orchestration improvement.",
  instructions: judgePrompt({
    task: "Return strict JSON score/label/reason for satisfaction judgment.",
  }),
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "github-copilot";
    const model = (context.get("model") as string) || "grok-code-fast-1";
    return `${provider}/${model}`;
  },
  tools: [],
  toolkits: [sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit],
  workspace: sharedWorkspaceFilesystemToolkit,
  workspaceToolkits: {},
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
  purpose: "Resolve user issues quickly with accurate, actionable guidance and escalation when confidence is low.",
  instructions: supportPrompt({
    tone: "helpful, concise, action-oriented",
    policy: "Never invent facts; ask minimal clarifying questions only when required.",
    tools: "workspace search and workspace skills",
    task: "Help users resolve issues quickly with concrete next steps.",
  }),
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "github-copilot";
    const model = (context.get("model") as string) || "grok-code-fast-1";
    return `${provider}/${model}`;
  },
  tools: [],
  toolkits: [sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit],
  workspace: sharedWorkspaceFilesystemToolkit,
  workspaceToolkits: {},
  workspaceSkillsPrompt: true,
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
