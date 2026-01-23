import { google } from '@ai-sdk/google'
import {
    AiSdkEmbeddingAdapter,
    Memory,
    NodeFilesystemBackend,
    PlanAgent,
    PlanAgentTodoStatus,
} from '@voltagent/core'
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from '@voltagent/libsql'
import { z } from 'zod'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import { assistantAgent } from './assistant.agent.js'
import { dataAnalyzerAgent } from './data-analyzer.agent.js'
import { factCheckerAgent } from './fact-checker.agent.js'
import { scrapperAgent } from './scrapper.agent.js'
import { synthesizerAgent } from './synthesizer.agent.js'
import { writerAgent } from './writer.agent.js'
import { defaultAgentHooks } from './agentHooks.js'

const generalInstructions = [
    'You are a Master Planner and Orchestrator. Your goal is to solve complex problems by breaking them down into manageable subtasks and delegating them to the most appropriate specialized agents.',
    '',
    '## Capabilities',
    "- **Planning**: Analyze the user's request and create a step-by-step plan.",
    '- **Delegation**: Assign tasks to sub-agents (Assistant, Writer, Data Analyzer, etc.) based on their expertise.',
    '- **Execution**: Use your tools (filesystem, internet search) to gather information or manage state.',
    '- **Synthesis**: Combine results from sub-agents into a coherent final output.',
    '',
    '## Sub-Agents',
    '- **Assistant**: General help, query generation, quick answers.',
    '- **Writer**: Drafting reports, articles, and content.',
    '- **Data Analyzer**: Analyzing datasets, patterns, and code.',
    '- **Fact Checker**: Verifying claims and checking for bias.',
    '- **Synthesizer**: Merging conflicting information and summarizing.',
    '- **Scrapper**: Extracting data from websites.',
    '',
    '## Workflow',
    "1. **Understand**: Read the user's request and context carefully.",
    '2. **Plan**: Create a high-level plan using `write_todos`.',
    '3. **Delegate**: Use `task` tool to assign work to sub-agents.',
    '4. **Review**: Check sub-agent outputs. If unsatisfactory, refine instructions and retry.',
    '5. **Finalize**: Compile the final response.',
].join('\n')

export const deepAgent = new PlanAgent({
    name: 'deep-work-agent',
    purpose:
        'Orchestrate complex workflows, research, and problem-solving tasks using specialized sub-agents.',
    systemPrompt: generalInstructions,

    model: ({ context }) => {
        const provider = (context.get('provider') as string) || 'github-copilot'
        const model = (context.get('model') as string) || 'gpt-5-mini'
        return `${provider}/${model}`
    },
    tools: [],
    toolkits: [thinkOnlyToolkit],
    memory: sharedMemory,
    maxSteps: 100,
    logger: voltlogger,
    maxOutputTokens: 64000,
    observability: voltObservability,
    hooks: defaultAgentHooks,
    subagents: [
        assistantAgent,
        writerAgent,
        dataAnalyzerAgent,
        factCheckerAgent,
        synthesizerAgent,
        scrapperAgent,
    ],
    generalPurposeAgent: true,
    task: {
        systemPrompt:
            'You are a strategic task manager. Break down complex objectives into atomic, delegatable tasks. Monitor progress and adjust the plan as needed.',
        taskDescription:
            'Execute the assigned complex task by coordinating specialized sub-agents.',
        maxSteps: 50,
        supervisorConfig: {
            includeAgentsMemory: true,
            fullStreamEventForwarding: {
                types: [
                    'tool-call',
                    'tool-result',
                    'text-delta',
                    'reasoning-start',
                    'reasoning-delta',
                    'reasoning-end',
                    'source',
                    'error',
                    'finish',
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
            rootDir: process.cwd(),
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
        toolTokenLimitBeforeEvict: 40000,
    },
    toolResultEviction: {
        enabled: true,
        tokenLimit: 20000,
    },
})
