import { google } from "@ai-sdk/google";
import { Agent, AiSdkEmbeddingAdapter, createTool, Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import z from "zod";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { dataAnalyzerPrompt } from "./prompts.js";

// Local SQLite for data analyzer
const dataAnalyzerMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/data-analyzer-memory.db",
  }),
  workingMemory: {
    enabled: true,
    scope: "user",
    schema: z.object({
      profile: z
        .object({
          name: z.string().optional(),
          role: z.string().optional(),
          timezone: z.string().optional(),
        })
        .optional(),
      preferences: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    }),
  },
  embedding: new AiSdkEmbeddingAdapter(google.embedding("text-embedding-004")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
});

// Data analysis tools
const analyzeDataTool = createTool({
  name: "analyze_data_patterns",
  description: "Analyze data for patterns, trends, and correlations",
  parameters: z.object({
    data: z.string().describe("The data to analyze"),
    analysisType: z.enum(["patterns", "trends", "correlations", "anomalies"]).describe("Type of analysis to perform"),
  }),
  execute: ({ data, analysisType }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Analyzing data for ${analysisType}`);

    // Basic data analysis implementation
    const lines = data.split('\n').filter(line => line.trim());
    const words = data.split(/\s+/).filter(word => word.length > 0);
    const sentences = data.split(/[.!?]+/).filter(s => s.trim());

    const analysis = {
      type: analysisType,
      dataSize: {
        characters: data.length,
        words: words.length,
        lines: lines.length,
        sentences: sentences.length
      },
      findings: [] as string[]
    };

    switch (analysisType) {
      case "patterns": {
        // Look for repeated phrases or structures
        const repeatedWords = words.filter((word, index, arr) =>
          arr.indexOf(word.toLowerCase()) !== index
        );
        if (repeatedWords.length > 0) {
          analysis.findings.push(`Found ${repeatedWords.length} repeated words indicating potential patterns`);
        }
        analysis.findings.push("Data shows structured content with clear sections");
        break;
      }

      case "trends": {
        // Analyze content progression
        const sections = data.split(/\n\s*\n/).filter(s => s.trim());
        analysis.findings.push(`Content divided into ${sections.length} logical sections`);
        if (sections.length > 3) {
          analysis.findings.push("Multi-part structure suggests comprehensive coverage");
        }
        break;
      }

      case "correlations": {
        // Look for related concepts
        const techTerms = words.filter(word =>
          /\b(api|data|system|model|analysis|research|method)\b/i.test(word)
        );
        if (techTerms.length > 0) {
          analysis.findings.push(`Identified ${techTerms.length} technical correlations in content`);
        }
        break;
      }

      case "anomalies": {
        // Check for unusual patterns
        const longLines = lines.filter(line => line.length > 200);
        if (longLines.length > 0) {
          analysis.findings.push(`Found ${longLines.length} unusually long lines that may contain anomalies`);
        }
        const shortLines = lines.filter(line => line.length < 10 && line.trim());
        if (shortLines.length > lines.length * 0.3) {
          analysis.findings.push("High proportion of short lines may indicate fragmented content");
        }
        break;
      }
    }

    return analysis;
  },
});

const extractInsightsTool = createTool({
  name: "extract_key_insights",
  description: "Extract key insights and actionable information from data",
  parameters: z.object({
    data: z.string().describe("The data to extract insights from"),
    focus: z.string().optional().describe("Specific focus area for insights"),
  }),
  execute: ({ data, focus }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Extracting insights${focus ? ` with focus on ${focus}` : ""}`);

    // Extract insights from the data
    const lines = data.split('\n').filter(line => line.trim());
    const words = data.split(/\s+/).filter(word => word.length > 0);

    const insights = {
      keyPoints: [] as string[],
      actionableItems: [] as string[],
      recommendations: [] as string[],
      focusArea: focus ?? "general"
    };

    // Extract key points based on content analysis
    if (data.toLowerCase().includes("research") || data.toLowerCase().includes("study")) {
      insights.keyPoints.push("Content contains research-related information");
    }

    if (data.toLowerCase().includes("data") || data.toLowerCase().includes("analysis")) {
      insights.keyPoints.push("Data analysis elements identified in content");
    }

    // Look for actionable items (sentences with imperative verbs)
    const imperativePatterns = /\b(must|should|need to|required|implement|create|develop|analyze)\b/gi;
    const actionableLines = lines.filter(line => imperativePatterns.test(line));
    if (actionableLines.length > 0) {
      insights.actionableItems.push(`Found ${actionableLines.length} potentially actionable statements`);
    }

    // Generate recommendations based on content
    if (words.length > 1000) {
      insights.recommendations.push("Content is comprehensive - consider breaking into sections for better readability");
    }

    if (lines.length < 10) {
      insights.recommendations.push("Content appears brief - may need expansion for complete analysis");
    }

    // Focus-specific insights
    if (focus) {
      const focusLower = focus.toLowerCase();
      const relevantLines = lines.filter(line =>
        line.toLowerCase().includes(focusLower)
      );
      if (relevantLines.length > 0) {
        insights.keyPoints.push(`Found ${relevantLines.length} items relevant to ${focus}`);
      }
    }

    return insights;
  },
});

export const dataAnalyzerAgent = new Agent({
  id: "data-analyzer",
  name: "Data Analyzer",
  purpose: "Analyze research data, extract patterns and insights, and provide data-driven conclusions",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: dataAnalyzerPrompt({
    dataType: "research data",
    focus: "patterns and insights",
    confidence: "high",
    format: "structured markdown",
    standards: "Use evidence-based conclusions, quantify findings where possible",
    task: "Analyze the provided data and extract key insights"
  }),
  tools: [analyzeDataTool, extractInsightsTool],
  toolkits: [thinkOnlyToolkit],
  memory: dataAnalyzerMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] DataAnalyzer starting`);
    },
    onToolStart: ({ tool, context }) => {
      const opId = context.context.get('opId') as string;
      voltlogger.info(`[${opId}] tool: ${String(tool.name)}`);
    },
    onToolEnd: ({ tool, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] tool ${tool.name} failed`);
      }
    },
    onEnd: ({ output, error, context }) => {
      const opId = context.context.get('opId') as string;
      if (error) {
        voltlogger.error(`[${opId}] DataAnalyzer error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] DataAnalyzer completed`);
      }
    },
    onPrepareMessages: ({ messages }) => {
      return { messages };
    },
  },
  temperature: 0.3, // Lower temperature for more consistent analysis
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  observability: voltObservability,
});
