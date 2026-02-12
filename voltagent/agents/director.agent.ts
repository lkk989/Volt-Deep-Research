import { Agent } from '@voltagent/core'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import { sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit } from '../workspaces/index.js'
import { defaultAgentHooks } from './agentHooks.js'
import { agentPrompt } from './prompts.js'; // kept single import

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
    capabilities: 'multi-agent coordination, workflow risk control, output contract enforcement',
    topic: 'research projects',
    depth: 'comprehensive',
    expertise: 'expert',
    tools: 'agent delegation, reasoning',
    responsibilities: 'Route tasks, enforce acceptance criteria, and block low-confidence outputs from promotion',
    standards: 'Ensure quality, source traceability, and measurable progress at each stage',
    task: 'Orchestrate research workflows with strict quality gates and escalation when blockers appear',
  }),
  tools: [],
  toolkits: [thinkOnlyToolkit, sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit],
  toolRouting: {
    embedding: {
      model: 'google/gemini-embedding-001',
      topK: 3,
      toolText: (tool) => {
        const tags = tool.tags?.join(', ') ?? '';
        return [tool.name, tool.description, tags].filter(Boolean).join('\n');
      },
    },
  },
  memory: sharedMemory,
  retriever: undefined,
  // No local sub-agents configured; delegate planning and execution to the PlanAgent (deep-work-agent / deep-research-agent).
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
  temperature: 0.3, // Lower temperature for consistent orchestration
  maxOutputTokens: 64000,
  maxSteps: 30, // More steps for complex orchestration
  stopWhen: undefined,
  markdown: true,
  voice: undefined,
  context: undefined,
  eval: undefined,
  logger: voltlogger,
  voltOpsClient: undefined,
  observability: voltObservability,
})
