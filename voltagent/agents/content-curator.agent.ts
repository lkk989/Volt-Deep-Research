
import { Agent, createHooks } from "@voltagent/core"
import { voltlogger } from "../config/logger.js"
import { knowledgeGraphToolkit } from "../tools/knowledge-graph-toolkit.js"
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js"
//import { contentAnalysisToolkit } from "../tools/content-analysis-toolkit.js"
//import { sentimentBiasToolkit } from "../tools/sentiment-bias-toolkit.js"

import { sharedMemory } from "../config/libsql.js"
import { voltObservability } from "../config/observability.js"
import { basedRetriever } from "../retriever/based.js"
import { sharedWorkspaceFilesystemToolkit, sharedWorkspaceRuntime, sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from "../workspaces/index.js"
import { contentCuratorPrompt } from "./prompts.js"

const contentCuratorHooks = createHooks({
  onStart: ({ agent, context }) => {
    const opId = crypto.randomUUID()
    context.context.set("operationId", opId)
    context.context.set("startTime", new Date().toISOString())
    context.context.set("curationDecisions", [])
    voltlogger.info(`[${opId}] Content Curator starting`, { agent: agent?.name })
  },
  onToolStart: ({ tool, context, args }) => {
    const opId = String(context.context.get("operationId") ?? "unknown")
    let argsString: string
    try {
      argsString = JSON.stringify(args)
    } catch {
      argsString = String(args)
    }
    voltlogger.info(`[${opId}] Tool starting: ${String(tool?.name)}`, { args: argsString })
  },
  onToolEnd: async ({ tool, error, context }) => {
    const opId = String(context.context.get("operationId") ?? "unknown")
    if (error) {
      voltlogger.error(`[${opId}] Tool failed: ${String(tool?.name)}`, { error })
    } else {
      voltlogger.info(`[${opId}] Tool completed: ${String(tool?.name)}`)
    }
  },
  onEnd: ({ agent, output, error, context }) => {
    const opId = String(context.context.get("operationId") ?? "unknown")
    const startTimeStr = String(context.context.get("startTime") ?? new Date().toISOString())
    const duration = new Date().getTime() - new Date(startTimeStr).getTime()
    const decisions = (context.context.get("curationDecisions") as any[]) ?? []
    if (error) {
      voltlogger.error(`[${opId}] Content Curator ended with error in ${duration}ms`, {
        agent: agent?.name,
        error,
        output,
        decisions,
      })
    } else {
      const outputSummary = (() => {
        if (typeof output === "string") {
          const str = output as string
          return str.length > 240 ? `${str.slice(0, 240)}...` : str
        }
        if (output !== undefined && output !== null) {
          return "non-string output"
        }
        return null
      })()
      voltlogger.info(`[${opId}] Content Curator completed in ${duration}ms`, {
        agent: agent?.name,
        outputSummary,
        decisions,
      })
    }
  },
})

export const contentCuratorAgent = new Agent({
  id: "content-curator",
  name: "Content Curator",
  purpose: "Score, de-duplicate, and prioritize content into high-value evidence bundles aligned with user goals.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: ({ context }) => {
    const userPrefs = (context?.get("userPreferences") as Record<string, unknown> | undefined) ?? {}
    const topics = Array.isArray(userPrefs.topics) ? (userPrefs.topics as string[]) : []
    const threshold = typeof userPrefs.qualityThreshold === "number" ? userPrefs.qualityThreshold : 7
    const contentType = String(context?.get("contentType") ?? "general")

    return contentCuratorPrompt({
      contentType,
      userTopics: topics.length > 0 ? topics.join(", ") : "general",
      qualityThreshold: `${threshold}/10`,
      tools: "knowledge graph toolkit, workspace search/skills, reasoning toolkit",
      standards: contentType === "academic"
        ? "Prioritize peer-reviewed evidence, methodological rigor, and citation quality."
        : contentType === "news"
          ? "Prioritize recency, source diversity, and corroboration across outlets."
          : "Prioritize credibility, relevance, and explainable ranking decisions.",
      task: "Curate, de-duplicate, score, and return ranked content bundles with rationale and next-read recommendations.",
    })
  },
  tools: ({ context }) => {
    const role = context?.get("role") ?? "user"
    // Base tools available to all users
    const baseTools: never[] = []
    // Admin-only tools could be added here
    if (role === "admin") {
      // Add admin-specific tools
    }
    return baseTools
  },
  toolkits: [
    thinkOnlyToolkit,
    knowledgeGraphToolkit,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
  ],
  workspace: sharedWorkspaceRuntime,
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
      model: "google/gemini-embedding-001",
      topK: 3,
      toolText: (tool) => {
        const tags = tool.tags?.join(", ") ?? "";
        return [tool.name, tool.description, tags].filter(Boolean).join("\n");
      },
    },
  },
  memory: sharedMemory,
  summarization: false,
  conversationPersistence: {
    mode: "step",
    debounceMs: 200,
    flushOnToolResult: true,
  },
  retriever: basedRetriever,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  inputMiddlewares: [],
  outputMiddlewares: [],
  maxMiddlewareRetries: 3,
  temperature: 0.4,
  maxOutputTokens: 64000,
  maxSteps: 25,
  maxRetries: 3,
  feedback: false,
  stopWhen: undefined,
  markdown: true,
  inheritParentSpan: true,
  voice: undefined,
  context: {
    provider: "google",
    model: "gemini-2.5-flash-lite-preview-09-2025",
  },
  logger: voltlogger,
  hooks: contentCuratorHooks,
  voltOpsClient: undefined,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
  eval: {
    scorers: {},
  },
})
