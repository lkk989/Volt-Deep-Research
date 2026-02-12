'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ChatInput } from './chat-input'
import { ChatMessages } from './chat-messages'
import { Spinner } from '@/components/ui/spinner'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'

interface ChatPanelProps {
    chatId: string
    userId: string
    selectedModel: string
    onSelectedModelChange: (modelId: string) => void
    initialMessages?: UIMessage[]
    resume?: boolean
}

export function ChatPanel({
    chatId,
    userId,
    selectedModel,
    onSelectedModelChange,
    initialMessages = [],
    resume = true,
}: ChatPanelProps) {
    const [loadedMessages, setLoadedMessages] = useState<UIMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [knownModels, setKnownModels] = useState<string[]>([])

    // Load messages from sharedMemory on mount
    useEffect(() => {
        const loadMessages = async () => {
            if (!resume) {
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                const response = await fetch(
                    `/api/messages?conversationId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(userId)}`
                )

                if (!response.ok) {
                    throw new Error('Failed to load messages')
                }

                const data = await response.json()
                const messages = data.data || []

                if (messages.length > 0) {
                    setLoadedMessages(messages)
                }
            } catch {
                // Silently fail - user can start a new conversation
                console.warn('Could not load previous messages')
            } finally {
                setIsLoading(false)
            }
        }

        void loadMessages()
    }, [chatId, userId, resume])

    // Combine initialMessages with loaded messages (loaded takes priority for resume)
    const allMessages =
        loadedMessages.length > 0 ? loadedMessages : initialMessages

    const { messages, sendMessage, status, error } = useChat({
        id: chatId,
        messages: allMessages,
        resume,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: ({
                id,
                messages: outgoingMessages,
            }) => {
                const lastMessage =
                    outgoingMessages[outgoingMessages.length - 1]

                const trimmedModelId = selectedModel.trim()
                const [provider, ...modelParts] = trimmedModelId.split('/')
                const model = modelParts.join('/')

                const hasProviderAndModel =
                    provider.length > 0 && model.length > 0

                return {
                    body: {
                        input: [lastMessage],
                        options: {
                            conversationId: id,
                            userId,
                            context: {
                                timezone:
                                    Intl.DateTimeFormat().resolvedOptions()
                                        .timeZone,
                                ...(trimmedModelId.length > 0 &&
                                hasProviderAndModel
                                    ? {
                                          provider,
                                          model,
                                          modelId: trimmedModelId,
                                      }
                                    : {}),
                            },
                        },
                    },
                }
            },
            prepareReconnectToStreamRequest: ({ id }) => ({
                api: `/api/chat/${id}/stream?userId=${encodeURIComponent(userId)}`,
            }),
        }),
        onError: (err: Error) => {
            // eslint-disable-next-line no-console
            console.error('Chat error:', err)
        },
    })

    const handlePromptClick = (suggestion: string) => {
        void sendMessage({ text: suggestion })
    }

    const handleSubmit = async (message: PromptInputMessage) => {
        if (message.text) {
            await sendMessage({ text: message.text })
        }
    }

    useEffect(() => {
        const modelsFromMessages = collectModelIdsFromMessages(messages)
        setKnownModels(uniquePreserveOrder([selectedModel, ...modelsFromMessages]))
    }, [messages, selectedModel])

    useEffect(() => {
        if (selectedModel.trim().length > 0) {
            return
        }

        const latestAssistantModel = findLatestAssistantModelId(messages)
        if (latestAssistantModel) {
            onSelectedModelChange(latestAssistantModel)
        }
    }, [messages, selectedModel, onSelectedModelChange])

    return (
        <div className="flex h-screen flex-col">
            {isLoading && (
                <div className="flex items-center gap-2 border-b bg-muted/20 px-6 py-2 text-xs text-muted-foreground">
                    <Spinner className="size-3" />
                    <span>Loading conversation…</span>
                </div>
            )}
            <ChatMessages
                messages={messages}
                status={status}
                error={error}
                onSuggestionClick={handlePromptClick}
            />
            <ChatInput
                onSubmit={handleSubmit}
                selectedModel={selectedModel}
                onModelChange={onSelectedModelChange}
                modelOptions={knownModels}
            />
        </div>
    )
}

function uniquePreserveOrder(values: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const v of values) {
        const trimmed = v.trim()
        if (trimmed.length === 0 || seen.has(trimmed)) {
            continue
        }
        seen.add(trimmed)
        result.push(trimmed)
    }
    return result
}

function collectModelIdsFromMessages(messages: UIMessage[]): string[] {
    const result: string[] = []
    for (const message of messages) {
        if (message.role !== 'assistant') {
            continue
        }

        const modelId = extractModelId(message.metadata)
        if (modelId) {
            result.push(modelId)
        }
    }
    return result
}

function findLatestAssistantModelId(messages: UIMessage[]): string | undefined {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i]
        if (message?.role !== 'assistant') {
            continue
        }
        const modelId = extractModelId(message.metadata)
        if (modelId) {
            return modelId
        }
    }
    return undefined
}

function extractModelId(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') {
        return undefined
    }
    const record = metadata as Record<string, unknown>
    const { model } = record
    if (!model || typeof model !== 'object') {
        return undefined
    }
    const modelRecord = model as Record<string, unknown>
    const { id } = modelRecord
    return typeof id === 'string' && id.trim().length > 0 ? id : undefined
}
