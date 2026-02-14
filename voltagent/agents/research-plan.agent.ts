import { NodeFilesystemBackend, PlanAgent } from '@voltagent/core'
import { google } from '@ai-sdk/google'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { chromaRetriever } from '../retriever/chroma.js'
import {
    sharedWorkspaceRuntime,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { defaultAgentHooks } from './agentHooks.js'
import { assistantAgent } from './assistant.agent.js'
import { dataAnalyzerAgent } from './data-analyzer.agent.js'
import { factCheckerAgent } from './fact-checker.agent.js'
import { scrapperAgent } from './scrapper.agent.js'
import { synthesizerAgent } from './synthesizer.agent.js'
import { writerAgent } from './writer.agent.js'

const researchPlanInstructions = [
    'You are a Research Orchestrator PlanAgent. Your mission is to conduct thorough, evidence-based research by coordinating specialized research sub-agents.',
    '',
    '## Core Responsibilities',
    '- Break complex research queries into systematic investigation steps',
    '- Delegate data gathering to Scrapper and Assistant agents',
    '- Direct analysis tasks to Data Analyzer and Fact Checker agents',
    '- Synthesize findings through Synthesizer and Writer agents',
    '- Ensure all claims are verified with sources and confidence levels',
    '',
    '## Research Workflow',
    '1. **Query Analysis**: Understand the research question and identify key investigation areas',
    '2. **Planning**: Create a research plan with `write_todos` - include information gathering, verification, and synthesis steps',
    '3. **Information Gathering**: Use `task` tool to delegate to Scrapper (web data) and Assistant (query generation)',
    '4. **Analysis**: Delegate to Data Analyzer for pattern detection and Fact Checker for claim verification',
    '5. **Synthesis**: Use Synthesizer to integrate findings and resolve contradictions',
    '6. **Final Report**: Delegate to Writer for publication-ready output with citations',
    '',
    '## Quality Standards',
    '- Every major claim must have a source citation',
    '- Cross-verify critical information across multiple sources',
    '- Flag uncertainty and confidence levels explicitly',
    '- Ensure logical flow from evidence to conclusions',
    '',
    '## Sub-Agents Available',
    '- Assistant: Query generation and search strategy',
    '- Scrapper: Web scraping and content extraction',
    '- Data Analyzer: Pattern analysis and insight extraction',
    '- Fact Checker: Claim verification with confidence scoring',
    '- Synthesizer: Multi-source integration and contradiction resolution',
    '- Writer: Final report composition with proper citations',
].join('\n')

export const researchPlanAgent = new PlanAgent({
    id: 'research-orchestrator',
    name: 'Research Orchestrator',
    purpose:
        'Coordinate comprehensive research workflows by delegating to specialized research sub-agents. Ensures evidence-based, well-cited research outputs.',
    systemPrompt: researchPlanInstructions,

    model: [
        {
            id: 'primary',
            model: google('gemini-2.5-flash-lite-preview-09-2025'),
            maxRetries: 3,
        },
        {
            id: 'secondary',
            model: google('gemini-2.0-flash-exp'),
            maxRetries: 2,
        },
    ],

    tools: [],
    toolkits: [sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit],

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

    memory: sharedMemory,
    maxSteps: 75,
    logger: voltlogger,
    maxOutputTokens: 64000,
    observability: voltObservability,

    hooks: {
        ...defaultAgentHooks,
        onStart: async ({ agent, context }) => {
            voltlogger.info(
                `[Research PlanAgent] Starting research operation`,
                {
                    agent: agent.name,
                    operationId: context.operationId,
                }
            )
        },
        onRetry: async (args) => {
            if (args.source === 'llm') {
                voltlogger.warn(
                    `[Research PlanAgent] LLM retry ${args.nextAttempt}/${args.maxRetries + 1}`,
                    { model: args.modelName }
                )
            }
        },
        onFallback: async ({ stage, fromModel, nextModel, operation }) => {
            voltlogger.warn(
                `[Research PlanAgent] Fallback (${stage}) from ${fromModel} to ${nextModel ?? 'next'}`,
                { operation }
            )
        },
    },

    retriever: chromaRetriever,

    subagents: [
        assistantAgent,
        scrapperAgent,
        dataAnalyzerAgent,
        factCheckerAgent,
        synthesizerAgent,
        writerAgent,
    ],

    generalPurposeAgent: true,

    task: {
        systemPrompt:
            'You are a research task manager. Break research objectives into atomic, delegatable subtasks. Monitor progress and maintain research quality standards.',
        taskDescription:
            'Execute research tasks by coordinating specialized sub-agents with proper verification and citation requirements.',
        maxSteps: 75,
        supervisorConfig: {
            includeAgentsMemory: true,
            fullStreamEventForwarding: {
                types: [
                    'tool-call',
                    'tool-result',
                    'text-delta',
                    'start-step',
                    'finish-step',
                ],
            },
        },
    },

    summarization: {
        triggerTokens: 100000,
        keepMessages: 8,
        maxOutputTokens: 6000,
        systemPrompt:
            'Summarize the research progress, maintaining key findings, sources, and next steps. Preserve all citation information.',
        enabled: true,
        model: 'google/gemini-2.0-flash-exp',
    },

    filesystem: {
        backend: new NodeFilesystemBackend({
            rootDir: sharedWorkspaceRuntime.filesystemRootDir,
            virtualMode: true,
            maxFileSizeMb: 25,
        }),
        systemPrompt:
            'Use the filesystem to store research data, intermediate findings, and source references.',
        customToolDescriptions: {
            lsInfo: 'List files in research workspace',
            read: 'Read research notes or source files',
            write: 'Save research findings or source data',
            edit: 'Update research notes with new information',
        },
        toolTokenLimitBeforeEvict: 12000,
    },

    toolResultEviction: {
        enabled: true,
        tokenLimit: 12000,
    },
})
