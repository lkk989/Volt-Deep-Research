import { Agent } from '@voltagent/core'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { basedRetriever } from '../retriever/based.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import {
    sharedWorkspaceFilesystemToolkit,
    sharedWorkspaceRuntime,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { defaultAgentHooks } from './agentHooks.js'
import { agentPrompt } from './prompts.js' // kept single import

export const directorAgent = new Agent({
    id: 'director',
    name: 'Director',
    purpose:
        'Act as orchestration governor: enforce task decomposition quality, evidence thresholds, and cross-agent output consistency.',
    model: ({ context }) => {
        const provider = (context.get('provider') as string) || 'google'
        const model =
            (context.get('model') as string) ||
            'gemini-2.5-flash-lite-preview-09-2025'
        return `${provider}/${model}`
    },
    // Use a string representation of the PromptCreator to satisfy the expected instructions type
    instructions: agentPrompt({
        agentName: 'Director',
        role: 'research orchestration governor',
        researchPhase: 'planning',
        qualityLevel: 'high with explicit verification gates',
        capabilities:
            'multi-agent coordination, workflow risk control, output contract enforcement',
        topic: 'research projects',
        depth: 'comprehensive',
        expertise: 'expert',
        tools: 'agent delegation, reasoning',
        responsibilities:
            'Route tasks, enforce acceptance criteria, and block low-confidence outputs from promotion',
        standards:
            'Ensure quality, source traceability, and measurable progress at each stage',
        task: 'Orchestrate research workflows with strict quality gates and escalation when blockers appear',
    }),
    tools: [],
    toolkits: [
        thinkOnlyToolkit,
        sharedWorkspaceSearchToolkit,
        sharedWorkspaceSkillsToolkit,
    ],
    workspace: sharedWorkspaceRuntime,
    workspaceToolkits: {
        sandbox: {
            customToolDescription:
                'A secure, ephemeral sandbox environment for executing code and commands. Use this for tasks that require code execution, file manipulation, or any operations that should be isolated from the main system. The sandbox provides a safe space to run potentially unsafe operations without risking the integrity of the main environment.',
            operationTimeoutMs: 10000,
            outputEvictionBytes: 10000,
            outputEvictionPath: '/sandbox/evicted_output.txt',
            systemPrompt:
                'You have access to a secure, ephemeral sandbox environment where you can execute code and commands. Use this sandbox for tasks that require code execution, file manipulation, or any operations that should be isolated from the main system. The sandbox provides a safe space to run potentially unsafe operations without risking the integrity of the main environment. Always ensure that your operations within the sandbox are necessary and relevant to your research objectives.',
            toolPolicies: {
                defaults: {
                    enabled: true,
                    needsApproval: false,
                },
            },
        },
        filesystem: {
            customToolDescriptions: {
                grep: 'Search for a specific string or pattern in files. Use this to quickly find relevant information across multiple documents in the workspace.',
                ls: 'List files and directories in the current workspace. Use this to explore the contents of the workspace and find files that may be relevant to your research.',
                delete_file:
                    'Permanently delete a file from the workspace. Use this with caution to remove irrelevant or outdated files that are no longer needed for your research.',
                edit_file:
                    'Edit the contents of a file in the workspace. Use this to update or refine information in existing files based on new insights or findings during your research process.',
                glob: 'Search for files in the workspace using wildcard patterns. Use this to find groups of files that match specific naming conventions or patterns relevant to your research.',
                list_files:
                    'List all files in the workspace. Use this to get an overview of all available documents and resources that you can utilize for your research.',
                list_tree:
                    'Display the directory structure of the workspace. Use this to understand how files are organized and to navigate through different folders to find relevant information for your research.',
                rmdir: 'Remove a directory from the workspace. Use this to clean up and organize the workspace by removing unnecessary directories that are no longer relevant to your research.',
                stat: 'Get detailed information about a specific file in the workspace. Use this to check the size, creation date, and other metadata of files that may be important for your research.',
                write_file:
                    'Create or overwrite a file in the workspace with specified content. Use this to save new information, insights, or data that you have gathered during your research process for future reference and use.',
            },
            toolPolicies: {
                defaults: {
                    enabled: true,
                    needsApproval: false,
                },
            },
        },
        search: {
            customIndexContentDescription:
                'The content of this index is a collection of documents and data relevant to complex multi-source research. It includes information from web sources, academic papers, standards documents, regulatory filings, and technical blogs. The content is organized to facilitate efficient retrieval of high-signal information that can inform research queries and investigation plans. Use this index to find relevant evidence and insights that can help generate comprehensive and targeted research strategies.',
            customIndexDescription:
                'A vector index containing embeddings of documents and data relevant to complex multi-source research. This index is designed to enable efficient retrieval of high-signal information that can inform the generation of research queries and investigation plans. The index supports semantic search capabilities, allowing you to find relevant evidence and insights based on the meaning and context of your queries, rather than just keyword matching.',
            customSearchDescription:
                'A powerful search tool that allows you to query the vector index of research documents and data. Use this tool to retrieve relevant information based on the content and context of your queries. The search supports semantic understanding, enabling you to find high-signal evidence and insights that can inform the generation of comprehensive and targeted research strategies.',
            operationTimeoutMs: 10000,
            systemPrompt:
                'You are a search tool that retrieves relevant information from a vector index of research documents and data. Use the provided query to find high-signal evidence and insights that can inform the generation of research queries and investigation plans. Focus on retrieving information that is relevant to complex multi-source research, including web sources, academic papers, standards documents, regulatory filings, and technical blogs.',
            toolPolicies: {
                defaults: {
                    enabled: true,
                    needsApproval: false,
                },
            },
        },
        skills: {
            operationTimeoutMs: 10000,
            systemPrompt:
                'You have access to a set of specialized skills that can be invoked to perform specific tasks or operations related to complex multi-source research. Each skill is designed to handle a particular aspect of the research process, such as data analysis, summarization, or evidence synthesis. Use these skills strategically to enhance your research capabilities and to execute complex operations that can help generate comprehensive and targeted research strategies.',
            toolPolicies: {
                defaults: {
                    enabled: true,
                    needsApproval: false,
                },
                tools: {
                    workspace_activate_skill: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_deactivate_skill: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_list_skills: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_read_skill: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_read_skill_asset: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_read_skill_reference: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_read_skill_script: {
                        enabled: true,
                        needsApproval: false,
                    },
                    workspace_search_skills: {
                        enabled: true,
                        needsApproval: false,
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
                const tags = tool.tags?.join(', ') ?? ''
                return [tool.name, tool.description, tags]
                    .filter(Boolean)
                    .join('\n')
            },
        },
    },
    memory: sharedMemory,
    summarization: false,
    conversationPersistence: {
        mode: 'step',
        debounceMs: 200,
        flushOnToolResult: true,
    },
    retriever: basedRetriever,
    subAgents: [],
    supervisorConfig: {
        includeAgentsMemory: true,
        systemMessage:
            'You are an expert director agent. Your role is to efficiently delegate tasks to specialized agents to achieve comprehensive research outcomes.',
        customGuidelines: [
            'Delegate operational tasks to the PlanAgent (deep-work-agent / deep-research-agent) using clear task descriptions',
            'When external data is required, instruct the PlanAgent to use its filesystem or retriever tools',
            'Require evidence and source verification for factual claims; prefer verifiable sources',
            'Monitor agent performance and adjust workflows as needed',
        ],
        fullStreamEventForwarding: {
            // Use a plain array of string literals instead of TypeScript union expressions
            types: [
                'file',
                'error',
                'abort',
                'source',
                'tool-call',
                'tool-result',
                'tool-error',
                'text-start',
                'text-end',
                'text-delta',
                'reasoning-start',
                'reasoning-end',
                'reasoning-delta',
                'tool-input-start',
                'tool-input-end',
                'tool-input-delta',
                'start-step',
                'finish-step',
                'start',
                'finish',
                'raw',
            ],
        },
        includeErrorInEmptyResponse: true,
        throwOnStreamError: false,
    },
    maxHistoryEntries: 100,
    hooks: defaultAgentHooks,
    inputGuardrails: [],
    outputGuardrails: [],
    inputMiddlewares: [],
    outputMiddlewares: [],
    maxMiddlewareRetries: 3,
    temperature: 0.3, // Lower temperature for consistent orchestration
    maxOutputTokens: 64000,
    maxSteps: 30, // More steps for complex orchestration
    maxRetries: 3,
    feedback: false,
    stopWhen: undefined,
    markdown: true,
    inheritParentSpan: true,
    voice: undefined,
    context: undefined,
    eval: undefined,
    logger: voltlogger,
    voltOpsClient: undefined,
    observability: voltObservability,
})
