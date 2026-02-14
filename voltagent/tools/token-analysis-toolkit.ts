import { encodingForModel, type TiktokenModel } from 'js-tiktoken'
import { getTokenCosts, type UsageLike } from 'tokenlens'
import {
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const hooksFor = (name: string) => ({
    onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
        voltlogger.info(`${name}: start`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
            args,
        })
    },
    onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
        if (error) {
            voltlogger.error(`${name}: error`, {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                error: error instanceof Error ? error.message : String(error),
            })
            return undefined
        }
        voltlogger.info(`${name}: end`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
        })
        return undefined
    },
})

export const countTokensTool = createTool({
    name: 'count_tokens',
    description:
        'Count tokens for a given text string using a specified model tokenizer (default: gpt-4o). Useful for estimating context usage, costs, and ensuring prompts fit within limits.',
    tags: [
        'tokens',
        'count',
        'estimation',
        'cost',
        'context',
        'llm',
        'tokenizer',
    ],
    parameters: z.object({
        text: z.string().describe('Text to count tokens for'),
        model: z
            .string()
            .default('gpt-4o')
            .describe(
                'Model ID to use for tokenization (e.g. gpt-4o, gpt-3.5-turbo)'
            ),
    }),
    outputSchema: z.object({
        tokenCount: z.number(),
        characterCount: z.number(),
        model: z.string(),
    }),
    hooks: hooksFor('count_tokens'),
    execute: async (args, context) => {
        ensureActive(context)

        let enc
        try {
            enc = encodingForModel(args.model as TiktokenModel)
        } catch {
            // Fallback to gpt-4o if model not found
            enc = encodingForModel('gpt-4o')
        }

        const tokens = enc.encode(args.text)
        return {
            tokenCount: tokens.length,
            characterCount: args.text.length,
            model: args.model,
        }
    },
})

export const truncateTextTool = createTool({
    name: 'truncate_text',
    description:
        'Truncate text to a maximum token count while preserving semantic integrity (cuts at token boundaries). Useful for fitting content into context windows.',
    tags: ['tokens', 'truncate', 'context', 'limit', 'slice', 'trim'],
    parameters: z.object({
        text: z.string().describe('Text to truncate'),
        maxTokens: z
            .number()
            .int()
            .min(1)
            .describe('Maximum number of tokens allowed'),
        model: z
            .string()
            .default('gpt-4o')
            .describe('Model ID to use for tokenization'),
        appendEllipsis: z
            .boolean()
            .default(true)
            .describe('Whether to append "..." if truncated'),
    }),
    outputSchema: z.object({
        truncatedText: z.string(),
        originalTokenCount: z.number(),
        newTokenCount: z.number(),
        isTruncated: z.boolean(),
    }),
    hooks: hooksFor('truncate_text'),
    execute: async (args, context) => {
        ensureActive(context)

        let enc
        try {
            enc = encodingForModel(args.model as TiktokenModel)
        } catch {
            enc = encodingForModel('gpt-4o')
        }

        const tokens = enc.encode(args.text)

        if (tokens.length <= args.maxTokens) {
            return {
                truncatedText: args.text,
                originalTokenCount: tokens.length,
                newTokenCount: tokens.length,
                isTruncated: false,
            }
        }

        const slicedTokens = tokens.slice(0, args.maxTokens)
        let truncated = enc.decode(slicedTokens)

        if (args.appendEllipsis) {
            truncated += '...'
        }

        return {
            truncatedText: truncated,
            originalTokenCount: tokens.length,
            newTokenCount: slicedTokens.length + (args.appendEllipsis ? 1 : 0),
            isTruncated: true,
        }
    },
})

export const estimateCostTool = createTool({
    name: 'estimate_cost',
    description:
        'Estimate the cost of a request based on input and output token counts for a specific model. Returns detailed cost breakdown in USD.',
    tags: ['cost', 'estimate', 'pricing', 'tokens', 'budget', 'usd'],
    parameters: z.object({
        model: z
            .string()
            .describe('Model ID (e.g. gpt-4o, claude-3-opus, gemini-1.5-pro)'),
        inputTokens: z.number().int().min(0).default(0),
        outputTokens: z.number().int().min(0).default(0),
    }),
    outputSchema: z.object({
        model: z.string(),
        inputCost: z.number(),
        outputCost: z.number(),
        totalCost: z.number(),
        currency: z.string(),
    }),
    hooks: hooksFor('estimate_cost'),
    execute: async (args, context) => {
        ensureActive(context)

        const usage: UsageLike = {
            promptTokens: args.inputTokens,
            completionTokens: args.outputTokens,
            totalTokens: args.inputTokens + args.outputTokens,
        }

        const costs = getTokenCosts({
            modelId: args.model,
            usage,
        })

        return {
            model: args.model,
            inputCost: costs.inputTokenUSD ?? 0,
            outputCost: costs.outputTokenUSD ?? 0,
            totalCost: (costs.inputTokenUSD ?? 0) + (costs.outputTokenUSD ?? 0),
            currency: 'USD',
        }
    },
})
