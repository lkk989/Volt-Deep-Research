import {
    createHooks,
    messageHelpers,
    type AgentTool,

    type OnStartHookArgs,
    type OnEndHookArgs,
    type OnPrepareMessagesHookArgs,
    type OnPrepareModelMessagesHookArgs,
    type OnToolStartHookArgs,
    type OnToolEndHookArgs,
    type OnHandoffHookArgs,
} from '@voltagent/core'
import safestringify from "@voltagent/core"
import { voltlogger } from '../config/logger.js'
import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';

// Comprehensive agent hooks following official VoltAgent patterns
const defaultAgentHooks = createHooks({
    /**
     * Called before the agent starts processing a request.
     */
    onStart: (args: OnStartHookArgs) => {
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
    onPrepareMessages: (args: OnPrepareMessagesHookArgs) => {
        const { messages, rawMessages, context } = args
        if (!messages || messages.length === 0) {
            throw new Error('No messages to prepare for LLM')
        }
        voltlogger.info(
            `Preparing ${messages.length} sanitized messages for LLM`
        )
        // Log context safely
        voltlogger.info(`[Hook] Context: ${new safestringify(context)}`)
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
    onPrepareModelMessages: (args: OnPrepareModelMessagesHookArgs) => {
        const { modelMessages, uiMessages } = args
        voltlogger.info(
            `Model payload contains ${uiMessages.length} messages`
        )

        // Inject a system message if none exists
        if (!uiMessages.some((msg) => msg.role === 'system')) {
            // System message content should be a plain string to match SystemModelMessage
            return {
                modelMessages: [
                    {
                        role: 'system',
                        content: 'You are a highly intelligent AI assistant. Provide detailed and thoughtful responses.',
                        providerOptions: {
                            google: {
                                thinkingConfig: {
                                    thinkingBudget: -1,
                                    includeThoughts: true,
                                    thinkingLevel: 'medium'
                                },
                                cachedContent: "Insights, analysis, and recommendations should be provided within the allocated budget.",
                                responseModalities: ['TEXT', 'IMAGE'],
                            } satisfies GoogleGenerativeAIProviderOptions,

                            openai: {
                                reasoningSummary: 'auto',
                                parallelToolCalls: true,
                                reasoningEffort: 'medium',
                                promptCacheRetention: 'in_memory',
                                textVerbosity: 'medium',
                            }  satisfies OpenAIResponsesProviderOptions,

                            anthropic: {
                                sendReasoning: true,
                                effort: 'low',
                                toolStreaming: true,
                                thinking: {
                                    type: "enabled",
                                    budgetTokens: 4096
                                },
                                cacheControl: {
                                    type: "ephemeral",
                                    ttl: "1h"
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
    onEnd: (args: OnEndHookArgs) => {
        const { agent, output, error, context } = args
        voltlogger.info(`[Hook] Context: ${new safestringify(context)}`)
        if (error) {
            voltlogger.error(
                `[Hook] Agent ${agent.name} finished with error:`,
                error
            )
            voltlogger.error(`[Hook] Error Details:`, error)
        } else if (output) {
            voltlogger.info(`[Hook] Agent ${agent.name} finished successfully.`)
            // Log usage or inspect output type
            if ('usage' in output && output.usage) {
                voltlogger.info(
                    `[Hook] Token Usage: ${output.usage.totalTokens}`
                )
            }
            if ('text' in output && output.text) {
                voltlogger.info(
                    `[Hook] Final text length: ${output.text.length}`
                )
            }
            if ('object' in output && output.object) {
                voltlogger.info(
                    `[Hook] Final object keys: ${Object.keys(output.object).join(', ')}`
                )
            }
        }
    },

    /**
     * Called before a tool executes.
     */
    onToolStart: (args: OnToolStartHookArgs) => {
        const {
            agent,
            tool,
            context,
            options: toolExecuteOptions,
            args: toolArgs,
        } = args
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
                  ? (toolArgs as object)
                  : { value: String(toolArgs) }

        const safeToolOptions: object | undefined =
            toolExecuteOptions === undefined
                ? undefined
                : typeof toolExecuteOptions === 'object' &&
                    toolExecuteOptions !== null
                  ? (toolExecuteOptions as object)
                  : { value: String(toolExecuteOptions) }

        voltlogger.info(`[Hook] Tool arguments:`, safeToolArgs)
        voltlogger.info(`[Hook] Tool options:`, safeToolOptions)
    },

    /**
     * Called after a tool completes or throws an error.
     */
    onToolEnd: (args: OnToolEndHookArgs) => {
        const { agent, tool, output, error, context } = args
        if (error) {
            voltlogger.error(`[Hook] Agent ${agent.name} tool ${tool.name} failed:`, {
                message: error.message,
            })
            voltlogger.error(`[Hook] Tool Error Details: ${JSON.stringify(error)}`)
            voltlogger.error(`[Hook] Context: ${new safestringify(context)}`)
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
            voltlogger.info(`[Hook] Context: ${new safestringify(context)}`)
        }
    },

    /**
     * Called when a task is handed off from a source agent to this agent.
     */
    onHandoff: (args: OnHandoffHookArgs) => {
        const { agent, sourceAgent } = args
        voltlogger.info(
            `[Hook] Task handed off from ${sourceAgent.name} to ${agent.name}`
        )
    },

    /**
     * Called when a handoff operation completes.
     * Useful for tracking sub-agent results and performance metrics.
     */
    onHandoffComplete: (args) => {
        const { agent, sourceAgent, result } = args
        voltlogger.info(
            `[Hook] Handoff from ${sourceAgent.name} to ${agent.name} completed`
        )
        if (result) {
            voltlogger.debug(`[Hook] Handoff result:`, { result })
        }
    },
})

// Export the default hooks for use in agents
export { defaultAgentHooks }
