import { Agent } from "@voltagent/core";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { arxivToolkit } from "../tools/arxiv-toolkit.js";
import { thinkOnlyToolkit } from "../tools/reasoning-tool.js";
import { getForecastOpenMeteo, getWeatherTool } from "../tools/weather-toolkit.js";
import { sharedWorkspaceFilesystemToolkit, sharedWorkspaceRuntime, sharedWorkspaceSandboxToolkit, sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from "../workspaces/index.js";
//import { defaultAgentHooks } from "./agentHooks.js";
import { assistantPrompt } from "./prompts.js";

export const assistantAgent = new Agent({
  id: "assistant",
  name: "Assistant",
  purpose: "Generate high-signal, source-targeted research queries and concise investigation plans for downstream specialist agents.",
  model: ({ context }) => {
    const provider = (context.get("provider") as string) || "google";
    const model = (context.get("model") as string) || "gemini-2.5-flash-lite-preview-09-2025";
    return `${provider}/${model}`;
  },
  instructions: assistantPrompt({
    topic: "complex multi-source research",
    strategy: "coverage-first then precision refinement",
    sources: "web, academic, standards docs, regulatory, technical blogs",
    tools: "reasoning, arXiv search/extract, workspace search, workspace skills",
    expertise: "advanced",
    task: "Generate prioritized query sets and angles to maximize evidence coverage with minimal redundancy.",
    queryFormat: "one-per-line with optional tags [intent|source-type|time-range]",
  }),
  tools: [getWeatherTool, getForecastOpenMeteo],
  toolkits: [
    thinkOnlyToolkit,
    arxivToolkit,
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
  retriever: undefined,
  subAgents: [],
  supervisorConfig: undefined,
  maxHistoryEntries: 100,
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID();
      context.context.set('opId', opId);
      voltlogger.info(`[${opId}] Assistant starting`);
      await Promise.resolve();
      return undefined;
    },
    onToolStart: async ({ tool, context }) => {
      const opId = String(context.context.get('opId'));
      voltlogger.info(`[${opId}] tool: ${String(tool.name)} starting`);
      await Promise.resolve();
      return undefined;
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errMsg = error instanceof Error ? (error.stack ?? error.message) : String(error);
        voltlogger.error(`[${opId}] tool ${String(tool.name)} failed: ${errMsg}`);
      } else {
        voltlogger.info(`[${opId}] tool ${String(tool.name)} completed`);
      }
      await Promise.resolve();
      return undefined;
    },
    onPrepareMessages: async ({ messages, context }) => {
      const opId = context?.context.get('opId');
      const opIdValue =
        typeof opId === 'string' && opId.length > 0 ? opId : 'unknown-op';
      voltlogger.debug(`[${opIdValue}] preparing messages`, {
        count: messages.length,
      });
      await Promise.resolve();
      return { messages };
    },
    onEnd: async ({ output, error, context }) => {
      const opId = String(context.context.get('opId'));
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        voltlogger.error(`[${opId}] Assistant error: ${errorMessage}`);
      } else if (output) {
        voltlogger.info(`[${opId}] Assistant completed`);
      } else {
        voltlogger.info(`[${opId}] Assistant ended without output`);
      }
      await Promise.resolve();
      return undefined;
    },
  },
  inputGuardrails: [],
  outputGuardrails: [],
  temperature: 0.7,
  maxOutputTokens: 64000,
  maxSteps: 25,
  stopWhen: undefined,
  markdown: false,
  voice: undefined,
  context: {
    provider: 'google',
    model: 'gemini-2.5-flash-lite-preview-09-2025',
  },
  eval: {
    scorers: {},
  },
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
});
