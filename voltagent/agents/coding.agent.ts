import { google } from '@ai-sdk/google'
import { Agent } from '@voltagent/core'

import * as crypto from 'node:crypto'
import z from 'zod'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'
import { voltObservability } from '../config/observability.js'
import { codeAnalysisToolkit } from '../tools/code-analysis-toolkit.js'
import { debugTool } from '../tools/debug-tool.js'
import { gitToolkit } from '../tools/git-toolkit.js'
import {
  githubGetFileContentsTool,
  githubGetRepoTool,
  githubGetTreeTool,
  githubGetUserTool,
  githubListCommitsTool,
  githubListIssuesTool,
  githubSearchCodeTool,
  githubSearchReposTool,
} from '../tools/github-toolkit.js'
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js'
import { testToolkit } from '../tools/test-toolkit.js'
import {
  sharedWorkspaceFilesystemToolkit,
  sharedWorkspaceSandboxToolkit,
  sharedWorkspaceSearchToolkit,
  sharedWorkspaceSkillsToolkit,
} from '../workspaces/index.js'
import { codingAgentPrompt } from './prompts.js'

export const codingAgent = new Agent({
  id: 'coding-agent',
  name: 'Coding Agent',
  purpose:
    'Implement and refactor code with production-grade correctness, maintainability, and alignment to repository architecture.',
  model: ({ context }) => {
    const provider = (context.get('provider') as string) || 'google'
    const model =
      (context.get('model') as string) ||
      'gemini-2.5-flash-lite-preview-09-2025'
    return `${provider}/${model}`
  },
  instructions: codingAgentPrompt({
    language: 'TypeScript',
    framework: 'VoltAgent',
    taskType: 'implementation',
    tools: 'code-analysis, git, test toolkit, workspace filesystem/search/sandbox/skills, debug',
    constraints:
      'Follow project patterns, preserve existing behavior unless explicitly changing, and keep changes minimal but complete',
    task: 'Implement requested feature/fix with clear reasoning, safe edits, and maintainable structure.',
  }),
  tools: [
    debugTool,
    githubGetFileContentsTool,
    githubGetRepoTool,
    githubGetTreeTool,
    githubGetUserTool,
    githubListCommitsTool,
    githubListIssuesTool,
    githubSearchCodeTool,
    githubSearchReposTool,
  ],
  toolkits: [
    codeAnalysisToolkit,
    sharedWorkspaceFilesystemToolkit,
    sharedWorkspaceSearchToolkit,
    sharedWorkspaceSandboxToolkit,
    sharedWorkspaceSkillsToolkit,
    gitToolkit,
    testToolkit,
    thinkOnlyToolkit,
  ],
  workspace: sharedWorkspaceFilesystemToolkit,
  workspaceToolkits: {},
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
  hooks: {
    onStart: async ({ context }) => {
      const opId = crypto.randomUUID()
      context.context.set('opId', opId)
      voltlogger.info(`[${opId}] Coding Agent starting`)
      await Promise.resolve()
    },
    onEnd: async ({ output, error, context }) => {
      const opId = String(context.context.get('opId'))
      if (error) {
        const msg =
          error instanceof Error ? error.message : String(error)
        voltlogger.error(`[${opId}] Coding Agent error: ${msg}`)
      } else if (output) {
        voltlogger.info(`[${opId}] Coding Agent completed`)
      }
      await Promise.resolve()
    },
    onToolStart: async ({ tool, context }) => {
      const opId = String(context.context.get('opId'))
      voltlogger.info(`[${opId}] tool: ${tool.name}`)
      await Promise.resolve()
    },
    onToolEnd: async ({ tool, error, context }) => {
      const opId = String(context.context.get('opId'))
      if (error) {
        const msg =
          error instanceof Error ? error.message : String(error)
        voltlogger.error(`[${opId}] tool ${tool.name} failed: ${msg}`)
      } else {
        voltlogger.info(`[${opId}] tool ${tool.name} completed`)
      }
      await Promise.resolve()
    },
  },
  temperature: 0.2, // Lower temperature for coding precision
  maxOutputTokens: 64000,
  maxSteps: 30,
  observability: voltObservability,
  logger: voltlogger,
  inputGuardrails: [],
  outputGuardrails: [],
})
