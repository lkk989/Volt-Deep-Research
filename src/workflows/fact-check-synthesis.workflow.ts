import { createWorkflowChain } from "@voltagent/core";
import { z } from "zod";
import { voltlogger } from "../config/logger.js";
import { factCheckerAgent } from "../agents/fact-checker.agent.js";
import { synthesizerAgent } from "../agents/synthesizer.agent.js";

export const factCheckSynthesisWorkflow = createWorkflowChain({
  id: "fact-check-synthesis",
  name: "Fact Check and Synthesis Workflow",
  purpose:
    "Fact-check claims against provided sources and synthesize a coherent narrative with an overall risk assessment.",
  input: z.object({
    topic: z.string().min(1),
    claims: z.string().min(1),
    sources: z.string().min(1),
  }),
  result: z.object({
    topic: z.string(),
    factCheckReport: z.string(),
    synthesis: z.string(),
    riskLevel: z.string(),
  }),
})
  .andTap({
    id: "log-start",
    execute: async ({ data }) => {
      voltlogger.info(
        `=== [FactCheckSynthesis] Starting fact-check for topic: ${data.topic} ===`
      );
    },
  })
  .andThen({
    id: "fact-check",
    execute: async ({ data }) => {
      const prompt = [
        "You are a precise, conservative fact-checking specialist.",
        "",
        `Topic: ${data.topic}`,
        "",
        "Claims to evaluate:",
        data.claims,
        "",
        "Available sources (these may include URLs, citations, or text excerpts):",
        data.sources,
        "",
        "Tasks:",
        "- Compare each claim against the sources.",
        "- Identify which claims are supported, partially supported, or not supported.",
        "- Explicitly call out any missing evidence or contradictions.",
        "- Be cautious and transparent about uncertainty.",
        "",
        "Output requirements:",
        "- Provide a clear narrative fact-check report in plain text.",
        "- At the end of the report, include a single line:",
        "  Overall risk level: LOW | MEDIUM | HIGH",
        "- Use one of those exact labels in ALL CAPS.",
      ].join("\n");

      const result = await factCheckerAgent.generateText(prompt);

      return {
        factCheckReport: result.text,
      };
    },
  })
  .andThen({
    id: "synthesize",
    execute: async ({ data, getStepData }) => {
      const factCheckReport =
        getStepData("fact-check")?.output?.factCheckReport?.toString() ?? "";

      const prompt = [
        "You are a synthesis specialist.",
        "",
        `Topic: ${data.topic}`,
        "",
        "Given the following fact-check report, craft a concise, coherent narrative that:",
        "- Emphasizes what is reliably supported by evidence.",
        "- Highlights key uncertainties or disputed areas.",
        "- Is suitable for an informed decision-maker.",
        "",
        "Fact-check report:",
        factCheckReport,
      ].join("\n");

      const result = await synthesizerAgent.generateText(prompt);

      return {
        synthesis: result.text,
      };
    },
  })
  .andThen({
    id: "finalize",
    execute: async ({ data, getStepData }) => {
      const topic = data.topic;

      const factCheckReport =
        getStepData("fact-check")?.output?.factCheckReport?.toString() ?? "";
      const synthesis =
        getStepData("synthesize")?.output?.synthesis?.toString() ?? "";

      const combinedText = `${factCheckReport}\n\n${synthesis}`;

      // Robust but simple risk level extraction with safe defaults.
      // Priority order: HIGH > MEDIUM > LOW if multiple mentions.
      const normalized = combinedText.toUpperCase();

      let riskLevel = "UNKNOWN";

      if (/\bHIGH\b/.test(normalized) && /OVERALL RISK LEVEL/.test(normalized)) {
        riskLevel = "HIGH";
      } else if (
        /\bMEDIUM\b/.test(normalized) &&
        /OVERALL RISK LEVEL/.test(normalized)
      ) {
        riskLevel = "MEDIUM";
      } else if (
        /\bLOW\b/.test(normalized) &&
        /OVERALL RISK LEVEL/.test(normalized)
      ) {
        riskLevel = "LOW";
      } else if (/\bHIGH RISK\b/.test(normalized)) {
        riskLevel = "HIGH";
      } else if (/\BMEDIUM RISK\b/.test(normalized)) {
        riskLevel = "MEDIUM";
      } else if (/\bLOW RISK\b/.test(normalized)) {
        riskLevel = "LOW";
      }

      return {
        topic,
        factCheckReport,
        synthesis,
        riskLevel,
      };
    },
  });
