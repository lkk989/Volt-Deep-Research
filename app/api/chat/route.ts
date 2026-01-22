import { getResumableStreamAdapter } from '@/lib/resumable-stream'
import { deepAgent } from '@/voltagent/agents/plan.agent'
import { voltlogger } from '@/voltagent/config/logger.js'
import { sharedMemory } from '@/voltagent/config/libsql.js'
import { setWaitUntil } from '@voltagent/core'
import { safeStringify } from '@voltagent/internal/utils'
import { createResumableChatSession } from '@voltagent/resumable-streams'
import { messageHelpers } from '@voltagent/core'
import type { UIMessage } from 'ai'
import { generateId } from 'ai'
import { after } from 'next/server'

const jsonError = (status: number, message: string) =>
    new Response(safeStringify({ error: message, message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Record<string, unknown>
        const messages = Array.isArray(body.messages)
            ? (body.messages as UIMessage[])
            : []
        const message = body.message as UIMessage | string | undefined
        const input = body.input as UIMessage[] | string | undefined
        const options = isRecord(body.options) ? body.options : undefined
        const conversationIdParam = getString(options, 'conversationId')
        const userIdParam = getString(options, 'userId')
        const conversationId = conversationIdParam.trim()
        // Hoisted helpers (declare here so they are available for the calls above)
        function isRecord(value: unknown): value is Record<string, unknown> {
            return (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
            )
        }

        function getString(record: unknown, key: string): string {
            if (!isRecord(record)) {
                return ''
            }
            const v = record[key]
            return typeof v === 'string' ? v : ''
        }

        // userIdParam is now guaranteed to be a string (getString returns string), so .trim() is safe
        const userId = userIdParam.trim()
        // Resolve the final input in a type-safe way
        const parsedInput: string | UIMessage[] | null = resolveInput(
            input,
            message,
            messages
        )

        function resolveInput(
            providedInput?: string | UIMessage[],
            maybeMessage?: string | UIMessage,
            messagesParam?: UIMessage[]
        ): string | UIMessage[] | null {
            // 1) explicit `input` takes precedence if non-empty
            if (typeof providedInput === 'string') {
                const s = providedInput.trim()
                if (s.length > 0) {
                    return s
                }
            } else if (
                Array.isArray(providedInput) &&
                providedInput.length > 0
            ) {
                return providedInput
            }

            // 2) single `message` next
            if (typeof maybeMessage === 'string') {
                const s = maybeMessage.trim()
                if (s.length > 0) {
                    return s
                }
            } else if (isUIMessageLike(maybeMessage)) {
                return [maybeMessage]
            }

            // 3) fallback to messages array
            if (Array.isArray(messagesParam) && messagesParam.length > 0) {
                return messagesParam
            }

            // nothing to stream
            return null
        }

        function isUIMessageLike(obj: unknown): obj is UIMessage {
            return (
                typeof obj === 'object' &&
                obj !== null &&
                ('role' in obj || 'parts' in obj)
            )
        }

        if (conversationId.length === 0) {
            return jsonError(400, 'options.conversationId is required')
        }

        if (userId.length === 0) {
            return jsonError(400, 'options.userId is required')
        }

        if (isEmptyInput(parsedInput)) {
            return jsonError(400, 'Message input is required')
        }

        // Enable non-blocking OTel export for Vercel/serverless
        // This ensures spans are flushed in the background without blocking the response
        setWaitUntil(after)

        const agentId = deepAgent.id
        const resumableStream = await getResumableStreamAdapter()
        const session = createResumableChatSession({
            adapter: resumableStream,
            conversationId,
            userId,
            agentId,
        })

        try {
            await session.clearActiveStream()
        } catch (error) {
            voltlogger.error('[API] Failed to clear active resumable stream', {
                error,
            })
        }

        // Stream text from the supervisor agent with proper context
        // Validate input type to satisfy TypeScript and avoid unsafe argument errors.
        function isUIMessage(obj: unknown): obj is UIMessage {
            return (
                typeof obj === 'object' &&
                obj !== null &&
                ('role' in obj || 'parts' in obj)
            )
        }

        function isStreamInput(v: unknown): v is string | UIMessage[] {
            return (
                typeof v === 'string' ||
                (Array.isArray(v) && v.every(isUIMessage))
            )
        }

        if (!isStreamInput(parsedInput)) {
            return jsonError(400, 'Invalid input type')
        }

        // Save message to sharedMemory before streaming
        if (typeof parsedInput === 'string') {
            const userMessage: UIMessage = {
                id: generateId(),
                role: 'user',
                parts: [{ type: 'text', text: parsedInput }],
            }
            await sharedMemory.addMessage(userMessage, userId, conversationId)
        } else if (Array.isArray(parsedInput) && parsedInput.length > 0) {
            // Save all messages (user input + context)
            // Use message helpers to ensure proper message format
            const validMessages = parsedInput.filter((msg) =>
                messageHelpers.hasContent(msg)
            )
            if (validMessages.length > 0) {
                await sharedMemory.addMessages(
                    validMessages,
                    userId,
                    conversationId
                )
            }
        }

        const result = await deepAgent.streamText(parsedInput, {
            userId,
            conversationId,
        })

        return result.toUIMessageStreamResponse({
            consumeSseStream: session.consumeSseStream,
            onFinish: session.onFinish,
        })
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[API] Chat error:', error)
        return jsonError(500, 'Internal server error')
    }
}

function isEmptyInput(input: unknown) {
    if (input === null) {
        return true
    }

    if (typeof input === 'string') {
        return input.trim().length === 0
    }

    return Array.isArray(input) && input.length === 0
}
