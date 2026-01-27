import type { AnthropicProviderOptions } from '@ai-sdk/anthropic'
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import {
    createHooks,
    messageHelpers,
    //  type AgentTool,
    type OnEndHookArgs,
    type OnHandoffCompleteHookArgs,
    type OnHandoffHookArgs,
    type OnPrepareMessagesHookArgs,
    type OnPrepareModelMessagesHookArgs,
    type OnStartHookArgs,
    type OnToolEndHookArgs,
    type OnToolStartHookArgs,
} from '@voltagent/core'
import { generateId } from 'ai'
import type { UIMessage } from 'ai'
import { sharedMemory } from '../config/libsql.js'
import { voltlogger } from '../config/logger.js'

const stringifyForLog = (value: unknown): string => {
    if (typeof value === 'string') {
        return value
    }
    if (value === null) {
        return 'null'
    }
    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value)
    }
    if (typeof value === 'symbol') {
        return value.toString()
    }
    if (typeof value === 'function') {
        return `[Function${value.name ? ': ' + value.name : ''}]`
    }
    try {
        const json = JSON.stringify(value)
        if (json !== undefined) {
            return json
        }
    } catch {
        // ignore
    }
    return `[Unserializable: ${typeof value}]`
}

// Comprehensive agent hooks following official VoltAgent patterns
const defaultAgentHooks = createHooks({
    /**
     * Called before the agent starts processing a request.
     */
    onStart: async (args: OnStartHookArgs) => {
        await Promise.resolve()
        const { agent, context } = args
        voltlogger.info(
            `[Hook] Agent ${agent.name} starting interaction at ${new Date().toISOString()}`
        )
        voltlogger.info(`[Hook] Operation ID: ${context.operationId}`)
    },

    /**
     * Called after VoltAgent sanitizes UI messages but before the LLM receives them.
     * `rawMessages` contains the unsanitized list for inspection or metadata recovery.
     */
    onPrepareMessages: async (args: OnPrepareMessagesHookArgs) => {
        await Promise.resolve()
        const { messages, rawMessages, context } = args
        if (messages.length === 0) {
            throw new Error('No messages to prepare for LLM')
        }
        voltlogger.info(
            `Preparing ${messages.length} sanitized messages for LLM`
        )
        // Log context safely
        voltlogger.info('[Hook] Context:', context)
        // Add timestamp to each message
        const timestamp = new Date().toLocaleTimeString()
        const enhanced = messages.map((msg) =>
            messageHelpers.addTimestampToMessage(msg, timestamp)
        )

        if (rawMessages) {
            // Access raw message structure for audit logging
            voltlogger.debug(`First raw message parts:`, rawMessages[0]?.parts)
        }

        return { messages: enhanced }
    },

    /**
     * Called after UI messages are converted into provider-specific ModelMessage objects.
     */
    onPrepareModelMessages: async (args: OnPrepareModelMessagesHookArgs) => {
        await Promise.resolve()
        const { modelMessages, uiMessages } = args
        voltlogger.info(`Model payload contains ${uiMessages.length} messages`)

        // Inject a system message if none exists
        if (!uiMessages.some((msg) => msg.role === 'system')) {
            // System message content should be a plain string to match SystemModelMessage
            return {
                modelMessages: [
                    {
                        role: 'system',
                        content:
                            'You are a highly intelligent AI assistant. Provide detailed and thoughtful responses.',
                        providerOptions: {
                            google: {
                                thinkingConfig: {
                                    thinkingBudget: -1,
                                    includeThoughts: true,
                                    thinkingLevel: 'medium',
                                },
                                cachedContent:
                                    'Insights, analysis, and recommendations should be provided within the allocated budget.',
                                responseModalities: ['TEXT', 'IMAGE'],
                            } satisfies GoogleGenerativeAIProviderOptions,

                            openai: {
                                reasoningSummary: 'auto',
                                parallelToolCalls: true,
                                reasoningEffort: 'medium',
                                promptCacheRetention: 'in_memory',
                                textVerbosity: 'medium',
                            } satisfies OpenAIResponsesProviderOptions,

                            anthropic: {
                                sendReasoning: true,
                                effort: 'low',
                                toolStreaming: true,
                                thinking: {
                                    type: 'enabled',
                                    budgetTokens: 4096,
                                },
                                cacheControl: {
                                    type: 'ephemeral',
                                    ttl: '1h',
                                },
                            } satisfies AnthropicProviderOptions,
                        },
                    },
                    ...modelMessages,
                ],
            }
        }

        return {}
    },

    /**
     * Called after the agent completes a request (success or failure).
     */
    onEnd: async (args: OnEndHookArgs) => {
        await Promise.resolve()
        const { agent, output, error, context } = args
        voltlogger.info('[Hook] Context:', context)
        if (error) {
            voltlogger.error(
                `[Hook] Agent ${agent.name} finished with error:`,
                error
            )
            voltlogger.error(`[Hook] Error Details:`, error)
        } else if (output) {
            voltlogger.info(`[Hook] Agent ${agent.name} finished successfully.`)
            if (typeof output === 'object' && output !== null) {
                const outputRecord = output as unknown as Record<string, unknown>
                const usage = outputRecord['usage']
                const text = outputRecord['text']
                const object = outputRecord['object']

                if (typeof usage === 'object' && usage !== null) {
                    const usageRecord = usage as Record<string, unknown>
                    const totalTokens = usageRecord['totalTokens']
                    if (typeof totalTokens === 'number') {
                        voltlogger.info(
                            `[Hook] Token Usage: ${totalTokens}`
                        )
                    }
                }

                if (typeof text === 'string') {
                    voltlogger.info(
                        `[Hook] Final text length: ${text.length}`
                    )
                }

                if (typeof object === 'object' && object !== null) {
                    voltlogger.info(
                        `[Hook] Final object keys: ${Object.keys(object).join(', ')}`
                    )
                }
            }
        }
    },

    /**
     * Called before a tool executes.
     */
    onToolStart: async (args: OnToolStartHookArgs) => {
        await Promise.resolve()
        const { agent, tool, context } = args

        const toolArgs: unknown = args.args
        const toolExecuteOptions: unknown = args.options
        voltlogger.info(
            `[Hook] Agent ${agent.name} starting tool: ${tool.name}`
        )

        // Avoid interpolating potentially complex objects into template strings.
        // Serialize context to a logger-friendly representation.
        const safeContext: object | undefined =
            context === undefined
                ? undefined
                : typeof context === 'object' && context !== null
                  ? context
                  : { value: String(context) }

        voltlogger.info(`[Hook] Tool context:`, safeContext)

        // Safely serialize tool args and options for logging to avoid passing `any`.
        const safeToolArgs: object | undefined =
            toolArgs === undefined
                ? undefined
                : typeof toolArgs === 'object' && toolArgs !== null
                  ? toolArgs
                  : { value: stringifyForLog(toolArgs) }

        const safeToolOptions: object | undefined =
            toolExecuteOptions === undefined
                ? undefined
                : typeof toolExecuteOptions === 'object' &&
                    toolExecuteOptions !== null
                  ? toolExecuteOptions
                  : { value: stringifyForLog(toolExecuteOptions) }

        voltlogger.info(`[Hook] Tool arguments:`, safeToolArgs)
        voltlogger.info(`[Hook] Tool options:`, safeToolOptions)
    },

    /**
     * Called after a tool completes or throws an error.
     */
    onToolEnd: async (args: OnToolEndHookArgs) => {
        await Promise.resolve()
        const { agent, tool, output, error, context } = args
        if (error) {
            voltlogger.error(
                `[Hook] Agent ${agent.name} tool ${tool.name} failed:`,
                {
                    message: error.message,
                }
            )
            voltlogger.error(
                `[Hook] Tool Error Details: ${JSON.stringify(error)}`
            )
            voltlogger.error('[Hook] Context:', context)
        } else {
            // Ensure output is an object or undefined for the logger
            let logOutput: object | undefined
            if (output === undefined) {
                logOutput = undefined
            } else if (output && typeof output === 'object') {
                logOutput = output
            } else {
                // Convert non-object outputs to a safe string representation without relying
                // on Object's default stringification (which yields "[object Object]").
                const safeString = ((): string => {
                    if (typeof output === 'string') {
                        return output
                    }
                    if (output === null) {
                        return 'null'
                    }
                    if (
                        typeof output === 'number' ||
                        typeof output === 'boolean' ||
                        typeof output === 'bigint'
                    ) {
                        return String(output)
                    }
                    if (typeof output === 'symbol') {
                        return output.toString()
                    }
                    if (typeof output === 'function') {
                        return `[Function${output.name ? ': ' + output.name : ''}]`
                    }
                    try {
                        const json = JSON.stringify(output)
                        if (json !== undefined) {
                            return json
                        }
                    } catch {
                        // Could not serialize (possibly circular); fall through to fallback below.
                    }
                    return `[Unserializable: ${typeof output}]`
                })()

                logOutput = { value: safeString }
            }
            voltlogger.info(
                `[Hook] Agent ${agent.name} tool ${tool.name} completed with result:`,
                logOutput
            )
            voltlogger.info('[Hook] Context:', context)
        }
        return undefined
    },

    /**
     * Called when a task is handed off from a source agent to this agent.
     */
    onHandoff: async (args: OnHandoffHookArgs) => {
        await Promise.resolve()
        const { agent, sourceAgent } = args
        voltlogger.info(
            `[Hook] Task handed off from ${sourceAgent.name} to ${agent.name}`
        )
    },

    /**
     * Called when a handoff operation completes.
     * Useful for tracking sub-agent results and performance metrics.
     */
    onHandoffComplete: async (args: OnHandoffCompleteHookArgs) => {
        await Promise.resolve()
        const { agent, sourceAgent, result, context } = args
        voltlogger.info(
            `[Hook] Handoff from ${sourceAgent.name} to ${agent.name} completed`
        )
        if (result) {
            voltlogger.debug(`[Hook] Handoff result:`, { result })
        }

        const { userId, conversationId } = context
        if (
            typeof userId !== 'string' ||
            userId.trim().length === 0 ||
            typeof conversationId !== 'string' ||
            conversationId.trim().length === 0
        ) {
            return
        }

        const subagentMessage: UIMessage = {
            id: generateId(),
            role: 'assistant',
            parts: [
                {
                    type: 'data-subagent-result',
                    data: {
                        subAgentId: agent.id,
                        subAgentName: agent.name,
                        text: result,
                    },
                },
            ],
            metadata: {
                kind: 'subagent-result',
                sourceAgentId: sourceAgent.id,
                sourceAgentName: sourceAgent.name,
            },
        }

        try {
            await sharedMemory.addMessage(
                subagentMessage,
                userId.trim(),
                conversationId.trim()
            )
        } catch (error) {
            voltlogger.warn('[Hook] Failed to persist subagent message', {
                error,
            })
        }
    },
})

// Export the default hooks for use in agents
export { defaultAgentHooks }
