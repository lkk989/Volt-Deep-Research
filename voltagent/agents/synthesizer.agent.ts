import { Agent, createTool } from "@voltagent/core";
import z from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { knowledgeGraphToolkit } from "../tools/knowledge-graph-toolkit.js";
import { ragToolkit } from "../tools/rag-toolkit.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { sharedWorkspaceFilesystemToolkit, sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from "../workspaces/index.js";
import { defaultAgentHooks } from "./agentHooks.js";
import { synthesizerPrompt } from "./prompts.js";

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
  purpose: "Fuse multi-source outputs into a coherent, contradiction-resolved narrative with explicit confidence and open gaps.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: synthesizerPrompt({
    method: "thematic integration",
    resolution: "evidence-based reconciliation",
    focus: "comprehensive understanding",
    structure: "thematic chapters with conclusions",
    tools: "synthesis/contradiction/narrative tools, knowledge graph toolkit, RAG toolkit, workspace retrieval",
    standards: "Maintain intellectual honesty, preserve attribution, and explicitly report unresolved conflicts",
    task: "Synthesize inputs into a decision-ready analysis with conflicts, confidence, and next-step gaps."
  }),
  tools: [synthesizeInformationTool, resolveContradictionsTool, createUnifiedNarrativeTool],
  toolkits: [
    thinkOnlyToolkit,
    knowledgeGraphToolkit,
    ragToolkit,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
  ],
  workspace: sharedWorkspaceFilesystemToolkit,
    workspaceToolkits: {
      "sandbox": {
        "customToolDescription": "A secure, ephemeral sandbox environment for executing code and commands. Use this for tasks that require code execution, file manipulation, or any operations that should be isolated from the main system. The sandbox provides a safe space to run potentially unsafe operations without risking the integrity of the main environment.",
        "operationTimeoutMs": 10000,
        "outputEvictionBytes": 10000,
        "outputEvictionPath": "/sandbox/evicted_output.txt",
        "systemPrompt": "You have access to a secure, ephemeral sandbox environment where you can execute code and commands. Use this sandbox for tasks that require code execution, file manipulation, or any operations that should be isolated from the main system. The sandbox provides a safe space to run potentially unsafe operations without risking the integrity of the main environment. Always ensure that your operations within the sandbox are necessary and relevant to your research objectives.",
        "toolPolicies": {
          "defaults": {
            "enabled": true,
            "needsApproval": false,
          },
        },
      },
      "filesystem": {
        "customToolDescriptions": {
          "grep": "Search for a specific string or pattern in files. Use this to quickly find relevant information across multiple documents in the workspace.",
          "ls": "List files and directories in the current workspace. Use this to explore the contents of the workspace and find files that may be relevant to your research.",
          "delete_file": "Permanently delete a file from the workspace. Use this with caution to remove irrelevant or outdated files that are no longer needed for your research.",
          "edit_file": "Edit the contents of a file in the workspace. Use this to update or refine information in existing files based on new insights or findings during your research process.",
          "glob": "Search for files in the workspace using wildcard patterns. Use this to find groups of files that match specific naming conventions or patterns relevant to your research.",
          "list_files": "List all files in the workspace. Use this to get an overview of all available documents and resources that you can utilize for your research.",
          "list_tree": "Display the directory structure of the workspace. Use this to understand how files are organized and to navigate through different folders to find relevant information for your research.",
          "rmdir": "Remove a directory from the workspace. Use this to clean up and organize the workspace by removing unnecessary directories that are no longer relevant to your research.",
          "stat": "Get detailed information about a specific file in the workspace. Use this to check the size, creation date, and other metadata of files that may be important for your research.",
          "write_file": "Create or overwrite a file in the workspace with specified content. Use this to save new information, insights, or data that you have gathered during your research process for future reference and use.",
        },
        "toolPolicies": {
          "defaults": {
            "enabled": true,
            "needsApproval": false,
          },
        },
      },
      "search": {
        "customIndexContentDescription": "The content of this index is a collection of documents and data relevant to complex multi-source research. It includes information from web sources, academic papers, standards documents, regulatory filings, and technical blogs. The content is organized to facilitate efficient retrieval of high-signal information that can inform research queries and investigation plans. Use this index to find relevant evidence and insights that can help generate comprehensive and targeted research strategies.",
        "customIndexDescription": "A vector index containing embeddings of documents and data relevant to complex multi-source research. This index is designed to enable efficient retrieval of high-signal information that can inform the generation of research queries and investigation plans. The index supports semantic search capabilities, allowing you to find relevant evidence and insights based on the meaning and context of your queries, rather than just keyword matching.",
        "customSearchDescription": "A powerful search tool that allows you to query the vector index of research documents and data. Use this tool to retrieve relevant information based on the content and context of your queries. The search supports semantic understanding, enabling you to find high-signal evidence and insights that can inform the generation of comprehensive and targeted research strategies.",
        "operationTimeoutMs": 10000,
        "systemPrompt": "You are a search tool that retrieves relevant information from a vector index of research documents and data. Use the provided query to find high-signal evidence and insights that can inform the generation of research queries and investigation plans. Focus on retrieving information that is relevant to complex multi-source research, including web sources, academic papers, standards documents, regulatory filings, and technical blogs.",
        "toolPolicies": {
          "defaults": {
            "enabled": true,
            "needsApproval": false,
          },
        },
      },
      "skills": {
        "operationTimeoutMs": 10000,
        "systemPrompt": "You have access to a set of specialized skills that can be invoked to perform specific tasks or operations related to complex multi-source research. Each skill is designed to handle a particular aspect of the research process, such as data analysis, summarization, or evidence synthesis. Use these skills strategically to enhance your research capabilities and to execute complex operations that can help generate comprehensive and targeted research strategies.",
        "toolPolicies": {
          "defaults": {
            "enabled": true,
            "needsApproval": false,
          },
          "tools": {
            "workspace_activate_skill": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_deactivate_skill": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_list_skills": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_read_skill": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_read_skill_asset": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_read_skill_reference": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_read_skill_script": {
              "enabled": true,
              "needsApproval": false,
            },
            "workspace_search_skills": {
              "enabled": true,
              "needsApproval": false,
            },
          },
        },
      },
    },
  workspaceSkillsPrompt: true,
  toolRouting: {
    embedding: {
      model: 'google/gemini-embedding-001',
      topK: 3,
      toolText: (tool) => {
        const tags = tool.tags?.join(", ") ?? "";
        return [tool.name, tool.description, tags].filter(Boolean).join("\n");
      },
    },
  },
  memory: sharedMemory,
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: async ({ context }) => {
      const opId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        context.context.set("opId", opId);
        voltlogger.info(`[${opId}] Synthesizer starting`);
      } catch (err) {
        voltlogger.error(
          `[${opId}] Failed to initialize Synthesizer opId in context: ${(err as Error)?.message ?? String(err)}`
        );
      }

      await Promise.resolve();
      return undefined;
    },
    onToolStart: async ({ tool, context }) => {
      const opId = (context.context.get("opId") as string) ?? "unknown-op";
      voltlogger.info(`[${opId}] tool start: ${tool.name}`);
      await Promise.resolve();
      return undefined;
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = (context.context.get("opId") as string) ?? "unknown-op";
      if (error) {
        voltlogger.error(
          `[${opId}] tool ${tool.name} failed: ${error?.message ?? String(error)}`
        );
        if (error instanceof Error) {
          const { stack } = error;
          if (typeof stack === "string" && stack.length > 0) {
            voltlogger.debug(
              `[${opId}] tool ${tool.name} stack: ${stack}`
            );
          }
        }
      } else {
        voltlogger.info(`[${opId}] tool ${tool.name} completed`);
      }

      // Return undefined explicitly to satisfy hook return type requirements
      await Promise.resolve();
      return undefined;
    },
    onEnd: async ({ output, error, context }) => {
      const opId = (context.context.get("opId") as string) ?? "unknown-op";
      if (error) {
        voltlogger.error(`[${opId}] Synthesizer error: ${error.message}`, {
          stack: error.stack,
        });
      } else if (output) {
        voltlogger.info(`[${opId}] Synthesizer completed`);
      } else {
        voltlogger.info(`[${opId}] Synthesizer finished with no output`);
      }
      await Promise.resolve();
      return undefined;
    },
    onPrepareMessages: async ({ messages, context }) => {
      const opId = context?.context.get("opId");
      const opIdValue =
        typeof opId === "string" && opId.length > 0 ? opId : "unknown-op";
      voltlogger.debug(`[${opIdValue}] preparing messages`, {
        count: messages.length,
      });
      await Promise.resolve();
      return { messages };
    },
  },
  temperature: 0.4, // Moderate temperature for creative synthesis
  maxOutputTokens: 64000,
  maxSteps: 25,
  markdown: true,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
});
