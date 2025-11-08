import { createWorkflowChain } from "@voltagent/core";
import { z } from "zod";
import { voltlogger } from "../config/logger.js";
import { dataAnalyzerAgent } from "../agents/data-analyzer.agent.js";

export const dataPatternAnalyzerWorkflow = createWorkflowChain({
  id: "data-pattern-analyzer",
  name: "Data Pattern Analyzer Workflow",
  purpose:
    "Analyze input text for patterns, trends, and anomalies with deterministic metrics.",
  input: z.object({
    text: z.string().min(1),
  }),
  result: z.object({
    summary: z.string(),
    metrics: z.object({
      characters: z.number(),
      words: z.number(),
      lines: z.number(),
      sentences: z.number(),
    }),
    findings: z.array(z.string()),
  }),
})
  .andTap({
    id: "log-start",
    execute: async ({ data }) => {
      voltlogger.info(
        `=== [DataPatternAnalyzer] Starting analysis === Characters: ${data.text.length}`
      );
    },
  })
  .andThen({
    id: "agent-analysis",
    execute: async ({ data }) => {
      const prompt = [
        "You are a focused data analysis specialist.",
        "Analyze the following text for:",
        "- Key patterns and trends",
        "- Notable clusters or categories of information",
        "- Anomalies, inconsistencies, or outliers",
        "",
        "Requirements:",
        "- Start with a short 2-3 sentence plain-text summary.",
        "- Then provide 3-7 concise bullet-point findings.",
        "- Do NOT use markdown headings or numbering. Use '-' for bullets.",
        "",
        "Text to analyze:",
        data.text,
      ].join("\n");

      const result = await dataAnalyzerAgent.generateText(prompt);

      return {
        agentRaw: result.text,
      };
    },
  })
  .andThen({
    id: "finalize",
    execute: async ({ data, getStepData }) => {
      const inputText = data.text;
      const agentOutput =
        getStepData("agent-analysis")?.output?.agentRaw?.toString() ?? "";

      // Deterministic metrics based solely on input text
      const characters = inputText.length;

      const words = inputText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      const lines = inputText.length === 0 ? 0 : inputText.split(/\r?\n/).length;

      const sentences = inputText
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0).length;

      // Derive summary and findings from agent output using simple parsing,
      // without depending on strict formats.
      const linesOut = agentOutput
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      let summary = "";
      const findings: string[] = [];

      for (const line of linesOut) {
        if (!summary && !line.startsWith("-")) {
          summary = line;
          continue;
        }
        if (line.startsWith("-")) {
          findings.push(line.replace(/^-+\s*/, "").trim());
        }
      }

      // Fallbacks to ensure result conforms to schema
      if (!summary) {
        summary =
          "The text was analyzed for patterns, trends, and anomalies. No specific summary was confidently extracted from the agent output.";
      }
      if (findings.length === 0 && agentOutput) {
        findings.push(agentOutput);
      }

      return {
        summary,
        metrics: {
          characters,
          words,
          lines,
          sentences,
        },
        findings,
      };
    },
  });
