import { Agent, buildScorer } from "@voltagent/core";
import { z } from "zod";
import { sharedMemory } from "../config/libsql.js";
import { voltlogger } from "../config/logger.js";
import { voltObservability } from "../config/observability.js";
import { basedRetriever } from "../retriever/based.js";
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
  toolRouting: undefined,
  workspace: sharedWorkspaceFilesystemToolkit,
  workspaceToolkits: {},
  workspaceSkillsPrompt: true,
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
  hooks: undefined,
  inputGuardrails: [],
  outputGuardrails: [],
  inputMiddlewares: [],
  outputMiddlewares: [],
  maxMiddlewareRetries: 3,
  maxOutputTokens: 64000,
  temperature: 0.3,
  maxSteps: 25,
  maxRetries: 3,
  feedback: false,
  stopWhen: undefined,
  markdown: false,
  inheritParentSpan: true,
  voice: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
  context: {
    provider: "github-copilot",
    model: "grok-code-fast-1",
  },
  eval: {
    scorers: {},
  },
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
  toolRouting: undefined,
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
  hooks: undefined,
  maxOutputTokens: 64000,
  memory: sharedMemory,
  inputMiddlewares: [],
  outputMiddlewares: [],
  maxMiddlewareRetries: 3,
  temperature: 0.3,
  maxSteps: 25,
  maxRetries: 3,
  feedback: false,
  stopWhen: undefined,
  markdown: false,
  inheritParentSpan: true,
  voice: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
  context: {
    provider: "github-copilot",
    model: "grok-code-fast-1",
  },
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
