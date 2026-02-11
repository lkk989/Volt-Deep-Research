import {
    createTool,
    type Tool,
    type ToolHookOnStartArgs,
    type ToolHookOnEndArgs,
} from '@voltagent/core'
import type { ToolExecuteOptions } from '@voltagent/core'
import { z } from 'zod'
import { inspect } from 'node:util'
import { voltlogger } from '../config/logger.js'

export const debugTool = createTool({
    name: 'log_debug_info',
    description: 'Logs debugging information',
    tags: ['debug', 'logging', 'context'],
    parameters: z.object({
        message: z.string().describe('Debug message to log'),
        level: z.enum(['info', 'warn', 'error', 'debug']).default('info'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        loggedMessage: z.string(),
        level: z.enum(['info', 'warn', 'error', 'debug']),
        timestamp: z.iso.datetime(),
        contextInfo: z.object({
            operationId: z.string().optional(),
            userId: z.string().optional(),
            conversationId: z.string().optional(),
        }),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { message: string; level: string }
            voltlogger.info('log_debug_info: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                level: params.level,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('log_debug_info: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('log_debug_info: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context) => {
        // Access operation metadata
        voltlogger.info(`Operation ID: ${context?.operationId}`)
        voltlogger.info(`User ID: ${context?.userId}`)
        voltlogger.info(`Conversation ID: ${context?.conversationId}`)

        // Log the message with the specified level
        const level = args.level
        const message = args.message

        switch (level) {
            case 'warn':
                voltlogger.warn(message)
                break
            case 'error':
                voltlogger.error(message)
                break
            case 'debug':
                voltlogger.debug(message)
                break
            case "info": { throw new Error('Not implemented yet: "info" case') }
            default:
                voltlogger.info(message)
        }

        // Access the original input
        // Safely stringify the original input for logging
        const originalInput = (() => {
            try {
                const json = JSON.stringify(context?.input, null, 2)
                if (json !== null) {
                    return json
                }
                if (context?.input === null) {
                    return ''
                }
                return inspect(context?.input, { depth: null })
            } catch {
                return inspect(context?.input, { depth: null })
            }
        })()
        voltlogger.info(`Original input: ${originalInput}`)

        // Check if operation is still active
        if (context && !context.isActive) {
            throw new Error('Operation has been cancelled')
        }

        return {
            success: true,
            loggedMessage: message,
            level,
            timestamp: new Date().toISOString(),
            contextInfo: {
                operationId: context?.operationId,
                userId: context?.userId,
                conversationId: context?.conversationId,
            },
        }
    },
})
