import { google } from '@ai-sdk/google'
import { NodeFilesystemBackend, PlanAgent } from '@voltagent/core'

import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { chromaRetriever } from '../retriever/chroma.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import {
    countTokensTool,
    estimateCostTool,
    truncateTextTool,
} from '../tools/token-analysis-toolkit.js'
import {
    sharedWorkspaceFilesystemToolkit,
    sharedWorkspaceRuntime,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { defaultAgentHooks } from './agentHooks.js'
import { assistantAgent } from './assistant.agent.js'
import { codeReviewerAgent } from './code-reviewer.agent.js'
import { codingAgent } from './coding.agent.js'
import { contentCuratorAgent } from './content-curator.agent.js'
import { dataAnalyzerAgent } from './data-analyzer.agent.js'
import { dataScientistAgent } from './data-scientist.agent.js'
import { directorAgent } from './director.agent.js'
import { factCheckerAgent } from './fact-checker.agent.js'
import { judgeAgent, supportAgent } from './judge.agent.js'
import { newsPlanAgent } from './news-plan.agent.js'
import { researchCoordinatorAgent } from './research-coordinator.agent.js'
import { researchPlanAgent } from './research-plan.agent.js'
import { scrapperAgent } from './scrapper.agent.js'
import { synthesizerAgent } from './synthesizer.agent.js'
import { writerAgent } from './writer.agent.js'

const generalInstructions = [
    'You are a Master Planner and Orchestrator. Your goal is to solve complex problems by breaking them down into manageable subtasks and delegating them to the most appropriate specialized agents.',
    '',
    '## Capabilities',
    "- **Planning**: Analyze the user's request and create a step-by-step plan.",
    '- **Delegation**: Assign tasks to sub-agents (Assistant, Writer, Data Analyzer, etc.) or sub-orchestrators based on their expertise.',
    '- **Execution**: Use your tools (filesystem, internet search) to gather information or manage state.',
    '- **Synthesis**: Combine results from sub-agents into a coherent final output.',
    '',
    '## Sub-Orchestrators (PlanAgents)',
    '- **Research Orchestrator**: For complex, multi-step research requiring verification and synthesis. Coordinates Assistant → Scrapper → Data Analyzer → Fact Checker → Synthesizer → Writer workflow.',
    '- **News Orchestrator**: For news aggregation, trend monitoring, and sentiment analysis. Uses HackerNews, Reddit, Dev.to, GitHub APIs with sentiment tools.',
    '',
    '## Individual Sub-Agents',
    '- **Assistant**: Generate high-signal query plans and investigation angles.',
    '- **Writer**: Convert findings into citation-backed, decision-ready reports.',
    '- **Data Analyzer**: Extract quantified patterns, confidence, and limitations.',
    '- **Fact Checker**: Verify claims with evidence and confidence labels.',
    '- **Synthesizer**: Resolve contradictions and produce coherent integrated narratives.',
    '- **Scrapper**: Extract structured source data with provenance metadata.',
    '- **Coding Agent**: Implement tools/workflows/fixes aligned to project architecture.',
    '- **Code Reviewer**: Audit code changes for correctness, security, and maintainability.',
    '- **Content Curator**: Rank and bundle high-value evidence for downstream synthesis.',
    '- **Data Scientist**: Run rigorous statistical analysis and uncertainty quantification.',
    '- **Research Coordinator**: Build dependency-aware plans and milestone tracking.',
    '- **Director**: Enforce orchestration quality gates and escalation decisions.',
    '- **Support Agent**: Handle user support and quick issue resolution.',
    '- **Satisfaction Judge**: Score output quality and user satisfaction signals.',
    '',
    '## Workflow',
    "1. **Understand**: Read the user's request and context carefully.",
    '2. **Choose Strategy**: For complex research with verification needs, delegate to Research Orchestrator. For news/sentiment tasks, use News Orchestrator. For focused tasks, use individual agents.',
    '3. **Plan**: Create a high-level plan using `write_todos`.',
    '4. **Delegate**: Use `task` tool to assign work to sub-agents or sub-orchestrators.',
    '5. **Review**: Check sub-agent outputs. If unsatisfactory, refine instructions and retry.',
    '6. **Finalize**: Compile the final response.',
].join('\n')

export const deepAgent = new PlanAgent({
    name: 'deep-work-agent',
    purpose:
        'Orchestrate complex research by delegating to specialists, enforcing quality gates, and synthesizing verified outcomes into final answers.',
    systemPrompt: generalInstructions,

    model: [
        {
            id: 'primary',
            model: google('gemini-2.5-flash-lite-preview-09-2025'),
            maxRetries: 3,
        },
        {
            id: 'secondary',
            model: "google/gemini-3-flash-preview",
            maxRetries: 2,
        },
    ],
    tools: [countTokensTool, estimateCostTool, truncateTextTool],
    toolkits: [
        thinkOnlyToolkit,
        sharedWorkspaceSearchToolkit,
        sharedWorkspaceSkillsToolkit,
        sharedWorkspaceFilesystemToolkit,
    ],
    toolRouting: {
        embedding: {
            model: 'google/gemini-embedding-001',
            normalize: true,
            maxBatchSize: 200,
            topK: 3,
            toolText: (tool) => {
                const tags = tool.tags?.join(', ') ?? ''
                return [tool.name, tool.description, tags]
                    .filter(Boolean)
                    .join('\n')
            },
        },
    },
    toolResultEviction: {
        enabled: true,
        tokenLimit: 20000
    },
    memory: sharedMemory,
    maxSteps: 100,
    logger: voltlogger,
    maxOutputTokens: 64000,
    observability: voltObservability,
    hooks: {
        ...defaultAgentHooks,
        onRetry: async (args) => {
            if (args.source === 'llm') {
                voltlogger.warn(
                    `[Deep PlanAgent] LLM retry ${args.nextAttempt}/${args.maxRetries + 1}`,
                    { model: args.modelName }
                )
            }
        },
        onFallback: async ({ stage, fromModel, nextModel, operation }) => {
            voltlogger.warn(
                `[Deep PlanAgent] Fallback (${stage}) from ${fromModel} to ${nextModel ?? 'next'}`,
                { operation }
            )
        },
    },
    retriever: chromaRetriever,
    subagents: [
        assistantAgent,
        codingAgent,
        codeReviewerAgent,
        contentCuratorAgent,
        dataScientistAgent,
        researchCoordinatorAgent,
        directorAgent,
        supportAgent,
        judgeAgent,
        writerAgent,
        dataAnalyzerAgent,
        factCheckerAgent,
        synthesizerAgent,
        scrapperAgent,
        researchPlanAgent,
        newsPlanAgent,
    ],
    generalPurposeAgent: true,
    task: {
        systemPrompt:
            'You are a strategic task manager. Break down complex objectives into atomic, delegatable tasks. Monitor progress and adjust the plan as needed.',
        taskDescription:
            'Execute the assigned complex task by coordinating specialized sub-agents.',
        maxSteps: 100,
        supervisorConfig: {
            includeAgentsMemory: true,
            fullStreamEventForwarding: {
                types: [
                    'file',
                    'error',
                    'abort',
                    'source',
                    'tool-call',
                    'tool-result',
                    'tool-error',
                    'tool-approval-request',
                    'tool-output-denied',
                    'text-start',
                    'text-delta',
                    'text-end',
                    'reasoning-start',
                    'reasoning-delta',
                    'reasoning-end',
                    'tool-input-start',
                    'tool-input-delta',
                    'tool-input-end',
                    'start-step',
                    'finish-step',
                    'start',
                    'finish',
                    'raw',
                ],
            },
        },
    },
    summarization: {
        triggerTokens: 120000,
        keepMessages: 6,
        maxOutputTokens: 8000,
        systemPrompt:
            'Summarize the following conversation briefly, focusing on key points and decisions made.',
        enabled: true,
        model: 'github-copilot/gpt-5-mini',
    },
    filesystem: {
        backend: new NodeFilesystemBackend({
            rootDir: sharedWorkspaceRuntime.filesystemRootDir,
            virtualMode: true,
            maxFileSizeMb: 25,
        }),
        systemPrompt:
            'You are an expert at managing and organizing files for research purposes. Use the filesystem to store, retrieve, and organize research data effectively.',
        customToolDescriptions: {
            lsInfo: 'Use this to get information about a file or directory without listing its contents. Helpful for understanding file types and metadata.',
            read: 'Use this to read the contents of a file. Only use this for text-based files.',
            readRaw:
                'Use this to read the raw contents of a file, including binary files. Be cautious when using this to avoid overwhelming amounts of data.',
            write: 'Use this to write content to a file. Ensure the content is well-organized and relevant to the research topic.',
            edit: 'Use this to edit the contents of an existing file. Make sure to maintain the integrity of the data while making necessary updates.',
            grepRaw:
                'Use this to search for a specific string or pattern within files, returning raw matching lines. Useful for finding specific data points in large files.',
            globInfo:
                'Use this to search for files matching a specific pattern. This is useful for finding related research documents.',
        },
        toolTokenLimitBeforeEvict: 12000,
    }
})
