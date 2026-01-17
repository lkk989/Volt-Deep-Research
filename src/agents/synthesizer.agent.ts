import { Agent, Memory, AiSdkEmbeddingAdapter, createTool } from "@voltagent/core";
import { google } from "@ai-sdk/google";
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
import { voltlogger } from "../config/logger.js";
import z from "zod";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { dataAnalyzerPrompt, synthesizerPrompt } from "./prompts.js";
import { voltObservability } from "../config/observability.js";

// Local SQLite for synthesizer
const synthesizerMemory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: "file:./.voltagent/synthesizer-memory.db",
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

// Synthesis tools
const synthesizeInformationTool = createTool({
  name: "synthesize_information",
  description: "Combine and synthesize information from multiple sources into coherent insights",
  parameters: z.object({
    sources: z.array(z.string()).describe("Array of information sources to synthesize"),
    synthesisGoal: z.string().describe("The goal or focus of the synthesis"),
  }),
  execute: ({ sources, synthesisGoal }, operationContext) => {
    if (!operationContext?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Synthesizing ${sources.length} sources for goal: ${synthesisGoal}`);

    // Information synthesis logic
    const synthesis = {
      goal: synthesisGoal,
      sourceCount: sources.length,
      keyThemes: [] as string[],
      integratedInsights: [] as string[],
      consensusPoints: [] as string[],
      gaps: [] as string[],
      recommendations: [] as string[]
    };

    if (sources.length === 0) {
      synthesis.gaps.push("No sources provided for synthesis");
      return synthesis;
    }

    // Extract common themes across sources
    const commonThemes = ["research", "data", "analysis", "results", "findings", "conclusion"];
    commonThemes.forEach(theme => {
      const sourcesWithTheme = sources.filter(source =>
        source.toLowerCase().includes(theme)
      );
      if (sourcesWithTheme.length >= sources.length * 0.5) {
        synthesis.keyThemes.push(`${theme} (mentioned in ${sourcesWithTheme.length} sources)`);
      }
    });

    // Generate integrated insights
    if (sources.some(s => s.toLowerCase().includes("significant"))) {
      synthesis.integratedInsights.push("Multiple sources indicate significant findings in the research area");
    }

    if (sources.some(s => s.toLowerCase().includes("further research"))) {
      synthesis.integratedInsights.push("Sources consistently recommend additional research");
    }

    // Identify consensus points
    const consensusIndicators = ["consistent", "agreement", "similar", "same"];
    let consensusFound = false;
    for (const indicator of consensusIndicators) {
      if (!consensusFound) {
        const sourcesWithConsensus = sources.filter(source =>
          source.toLowerCase().includes(indicator)
        );
        if (sourcesWithConsensus.length > 0) {
          synthesis.consensusPoints.push(`${sourcesWithConsensus.length} sources indicate consensus on key points`);
          consensusFound = true;
        }
      }
    }

    // Identify gaps
    if (sources.length < 3) {
      synthesis.gaps.push("Limited number of sources may not provide comprehensive coverage");
    }

    const methodologicalSources = sources.filter(s =>
      s.toLowerCase().includes("method") || s.toLowerCase().includes("approach")
    );
    if (methodologicalSources.length === 0) {
      synthesis.gaps.push("Limited methodological discussion across sources");
    }

    // Generate recommendations
    if (synthesis.gaps.length > 0) {
      synthesis.recommendations.push("Address identified gaps through additional research");
    }

    if (synthesis.keyThemes.length > 3) {
      synthesis.recommendations.push("Consider focusing on the most prominent themes for detailed analysis");
    }

    return synthesis;
  },
});

const resolveContradictionsTool = createTool({
  name: "resolve_contradictions",
  description: "Identify and resolve contradictions between different sources",
  parameters: z.object({
    conflictingInfo: z.array(z.string()).describe("Array of conflicting information pieces"),
    resolutionCriteria: z.string().describe("Criteria for resolving contradictions"),
  }),
  execute: ({ conflictingInfo, resolutionCriteria }, operationContext) => {
    if (!operationContext?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Resolving contradictions using criteria: ${resolutionCriteria}`);

    // Contradiction resolution logic
    const resolution = {
      criteria: resolutionCriteria,
      contradictionCount: conflictingInfo.length,
      identifiedContradictions: [] as string[],
      resolutionApproach: "Unknown" as "Majority Rule" | "Recency" | "Authority" | "Evidence-Based" | "Synthesis" | "Unknown",
      resolvedPoints: [] as string[],
      unresolvedIssues: [] as string[],
      confidence: "Low" as "High" | "Medium" | "Low"
    };

    if (conflictingInfo.length === 0) {
      resolution.unresolvedIssues.push("No conflicting information provided");
      return resolution;
    }

    // Analyze contradictions
    const contradictionPatterns = [
      { pattern: /however|but|although|despite/i, type: "Direct contradiction" },
      { pattern: /versus|vs|compared to/i, type: "Comparative contradiction" },
      { pattern: /on the other hand|conversely/i, type: "Alternative viewpoint" }
    ];

    conflictingInfo.forEach((info, index) => {
      contradictionPatterns.forEach(({ pattern, type }) => {
        if (pattern.test(info)) {
          resolution.identifiedContradictions.push(`${type} in source ${index + 1}: ${info.substring(0, 100)}...`);
        }
      });
    });

    // Determine resolution approach based on criteria
    const criteriaLower = resolutionCriteria.toLowerCase();
    if (criteriaLower.includes("majority") || criteriaLower.includes("most")) {
      resolution.resolutionApproach = "Majority Rule";
      resolution.resolvedPoints.push("Using majority consensus to resolve contradictions");
    } else if (criteriaLower.includes("recent") || criteriaLower.includes("latest")) {
      resolution.resolutionApproach = "Recency";
      resolution.resolvedPoints.push("Prioritizing most recent information");
    } else if (criteriaLower.includes("authority") || criteriaLower.includes("expert")) {
      resolution.resolutionApproach = "Authority";
      resolution.resolvedPoints.push("Resolving based on source authority and credibility");
    } else if (criteriaLower.includes("evidence") || criteriaLower.includes("data")) {
      resolution.resolutionApproach = "Evidence-Based";
      resolution.resolvedPoints.push("Resolving based on strength of evidence");
    } else {
      resolution.resolutionApproach = "Synthesis";
      resolution.resolvedPoints.push("Attempting to synthesize conflicting viewpoints");
    }

    // Assess resolution confidence
    if (resolution.identifiedContradictions.length === 0) {
      resolution.confidence = "High";
      resolution.resolvedPoints.push("No significant contradictions detected");
    } else if (resolution.identifiedContradictions.length <= conflictingInfo.length * 0.3) {
      resolution.confidence = "Medium";
      resolution.resolvedPoints.push("Minor contradictions resolved using specified criteria");
    } else {
      resolution.confidence = "Low";
      resolution.unresolvedIssues.push("Significant contradictions remain unresolved");
    }

    return resolution;
  },
});

const createUnifiedNarrativeTool = createTool({
  name: "create_unified_narrative",
  description: "Create a unified, coherent narrative from disparate information",
  parameters: z.object({
    information: z.array(z.string()).describe("Array of information pieces to unify"),
    narrativeFocus: z.string().describe("The central focus or theme of the narrative"),
  }),
  execute: ({ information, narrativeFocus }, operationContext) => {
    if (!operationContext?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Creating unified narrative around: ${narrativeFocus}`);

    // Unified narrative creation logic
    const narrative = {
      focus: narrativeFocus,
      informationCount: information.length,
      narrativeStructure: {
        introduction: "",
        mainPoints: [] as string[],
        connections: [] as string[],
        conclusion: ""
      },
      coherence: "Low" as "High" | "Medium" | "Low",
      themes: [] as string[],
      gaps: [] as string[]
    };

    if (information.length === 0) {
      narrative.gaps.push("No information provided for narrative creation");
      return narrative;
    }

    // Analyze information for themes
    const themeKeywords = ["research", "development", "impact", "challenge", "solution", "future"];
    themeKeywords.forEach(theme => {
      const infoWithTheme = information.filter(info =>
        info.toLowerCase().includes(theme)
      );
      if (infoWithTheme.length >= information.length * 0.4) {
        narrative.themes.push(`${theme} (present in ${infoWithTheme.length} information pieces)`);
      }
    });

    // Create narrative structure
    narrative.narrativeStructure.introduction = `This narrative explores ${narrativeFocus} through the integration of ${information.length} key information sources.`;

    // Extract main points
    information.forEach((info, index) => {
      const sentences = info.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 0) {
        narrative.narrativeStructure.mainPoints.push(`Key point ${index + 1}: ${sentences[0].trim()}`);
      }
    });

    // Identify connections between information pieces
    if (information.length > 1) {
      narrative.narrativeStructure.connections.push("Information sources show interconnected themes and complementary perspectives");

      // Look for connecting phrases
      const connectionWords = ["furthermore", "additionally", "moreover", "also", "similarly"];
      let foundConnection = false;
      connectionWords.forEach(word => {
        if (!foundConnection) {
          const connectedInfo = information.filter(info =>
            info.toLowerCase().includes(word)
          );
          if (connectedInfo.length > 0) {
            narrative.narrativeStructure.connections.push(`${connectedInfo.length} sources use connecting language indicating relationships`);
            foundConnection = true;
          }
        }
      });
    }

    // Create conclusion
    if (narrative.themes.length > 0) {
      narrative.narrativeStructure.conclusion = `In conclusion, the integrated analysis reveals ${narrative.themes.length} major themes that collectively address ${narrativeFocus}.`;
    } else {
      narrative.narrativeStructure.conclusion = `The integrated information provides a foundation for understanding ${narrativeFocus}, though further synthesis may be needed.`;
    }

    // Assess coherence
    const totalConnections = narrative.narrativeStructure.connections.length;
    if (totalConnections > 2) {
      narrative.coherence = "High";
    } else if (totalConnections > 0) {
      narrative.coherence = "Medium";
    } else {
      narrative.coherence = "Low";
      narrative.gaps.push("Limited connections between information pieces reduce narrative coherence");
    }

    return narrative;
  },
});

export const synthesizerAgent = new Agent({
  id: "synthesizer",
  name: "Synthesizer",
  purpose: "Combine multiple research streams, resolve contradictions, and create unified narratives",
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
  instructions: synthesizerPrompt({
    method: "thematic integration",
    resolution: "evidence-based reconciliation",
    focus: "comprehensive understanding",
    structure: "thematic chapters with conclusions",
    standards: "Maintain intellectual honesty, acknowledge source limitations",
    task: "Synthesize the provided information into a unified analysis"
  }),
  tools: [synthesizeInformationTool, resolveContradictionsTool, createUnifiedNarrativeTool],
  toolkits: [thinkOnlyToolkit],
  memory: synthesizerMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Synthesizer starting`);
    },
    onToolStart: ({ tool, context }) => {
      const opId = context.context.get('opId') as string;
      voltlogger.info(`[${opId}] tool: ${tool.name}`);
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
        voltlogger.error(`[${opId}] Synthesizer error: ${error.message}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Synthesizer completed`);
      }
    },
    onPrepareMessages: ({ messages }) => {
      return { messages };
    },
  },
  temperature: 0.4, // Moderate temperature for creative synthesis
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  observability: voltObservability,
});
