import { Agent } from '@voltagent/core'
//import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql";
//import z from "zod";
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import {
  extractFrontmatterTool,
  extractUrlsTool,
  htmlSanitizeTool,
  htmlToMarkdownTool,
  htmlToPlaintextTool,
  jsonToXmlTool,
  markdownToHtmlTool,
  syntaxHighlightTool,
  xmlToJsonTool,
} from '../tools/content-transformation-toolkit.js'
import {
  sharedWorkspaceSearchToolkit,
  sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { defaultAgentHooks } from './agentHooks.js'
import { writerPrompt } from './prompts.js'

export const writerAgent = new Agent({
  id: 'writer',
  name: 'Writer',
  purpose:
    'Produce publication-ready, citation-backed synthesis reports that convert multi-agent findings into clear decisions and next actions.',
  instructions: writerPrompt({
    audienceLevel: 'expert',
    reportType: 'decision-oriented technical research synthesis',
    wordCount: '2500-6000 words',
    style: 'analytical, evidence-driven, structured',
    tools: 'workspace search, workspace skills, upstream synthesis/fact-check outputs',
    standards:
      'Use precise claims, explicit citations, uncertainty labels, and no unsupported assertions.',
    guidelines:
      'Prioritize correctness, traceability, tradeoff clarity, and decision-ready recommendations.',
    tone: 'formal, objective, high-signal',
    mustCite: 'true',
    task: 'Produce a high-quality report from gathered research outputs.',
  }),
  model: ({ context }) => {
    const provider = (context.get('provider') as string) || 'google'
    const model =
      (context.get('model') as string) ||
      'gemini-2.5-flash-lite-preview-09-2025'
    return `${provider}/${model}`
  },
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID()
      context.context.set('opId', opId)
      voltlogger.info(`[${opId}] Writer starting`)
      await Promise.resolve()
    },
    onToolStart: async ({ tool, context }) => {
      const opId = context.context.get('opId') as string
      voltlogger.info(`[${opId}] tool: ${tool.name}`)
      await Promise.resolve()
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = context.context.get('opId') as string
      if (error) {
        voltlogger.error(
          `[${opId}] tool ${tool.name} failed: ${error?.message}${error?.stack ? `\n${error.stack}` : ''}`
        )
      } else {
        voltlogger.info(`[${opId}] tool ${tool.name} completed`)
      }
      await Promise.resolve()
    },
    onEnd: async ({ output, error, context }) => {
      const opId = context.context.get('opId') as string
      if (error) {
        voltlogger.error(`[${opId}] Writer error: ${error.message}`)
      } else if (output) {
        voltlogger.info(`[${opId}] Writer completed`)
      }
      await Promise.resolve()
    },
    onPrepareMessages: async ({ messages, context }) => {
      const opId = context?.context.get('opId')
      const opIdValue =
        typeof opId === 'string' && opId.length > 0
          ? opId
          : 'unknown-op'
      voltlogger.debug(`[${opIdValue}] preparing messages`, {
        count: messages.length,
      })
      await Promise.resolve()
      return { messages }
    },
  },
  tools: [
    markdownToHtmlTool,
    htmlSanitizeTool,
    syntaxHighlightTool,
    htmlToPlaintextTool,
    htmlToMarkdownTool,
    xmlToJsonTool,
    jsonToXmlTool,
    extractUrlsTool,
    extractFrontmatterTool,
  ],
  toolkits: [sharedWorkspaceSearchToolkit, sharedWorkspaceSkillsToolkit],
  workspace: sharedWorkspaceSkillsToolkit,
  workspaceToolkits: {},
  workspaceSkillsPrompt: true,
  memory: sharedMemory,
  retriever: undefined,
  markdown: true,
  maxSteps: 50,
  logger: voltlogger,
  observability: voltObservability,
  inputGuardrails: [],
  outputGuardrails: [],
})
