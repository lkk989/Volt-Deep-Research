'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
    DefaultChatTransport,
    type UIMessage,
    safeValidateUIMessages,
} from 'ai'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { Spinner } from '@/components/ui/spinner'
import { ChatInput } from './chat-input'
import { ChatMessages } from './chat-messages'
import {
    getVoltAgentChatEndpoint,
    getVoltAgentChatResumeEndpoint,
} from '@/lib/voltagent-client'
import {
    useVoltAgent,
    useVoltConversationMessages,
} from '@/hooks/use-voltagent'

interface ChatThreadProps {
    activeAgentId: string
    chatId: string
    userId: string
    selectedModel: string
    onSelectedModelChange: (modelId: string) => void
    initialMessages?: UIMessage[]
    resume?: boolean
}

export function ChatThread({
    activeAgentId,
    chatId,
    userId,
    selectedModel,
    onSelectedModelChange,
    initialMessages = [],
    resume = true,
}: ChatThreadProps) {
    const { data: conversationMessages = [], isLoading: isMessagesLoading } =
        useVoltConversationMessages(chatId, userId, activeAgentId)
    const { data: activeAgent } = useVoltAgent(activeAgentId)
    const [knownModels, setKnownModels] = useState<string[]>([])
    const [showWebPreview, setShowWebPreview] = useState(false)

    const validatedLoadedMessages = useMemo(
        () => conversationMessages,
        [conversationMessages]
    )
    const allMessages =
        validatedLoadedMessages.length > 0
            ? validatedLoadedMessages
            : initialMessages

    const { messages, setMessages, sendMessage, regenerate, status, error } =
        useChat({
            id: chatId,
            messages: allMessages,
            resume,
            transport: new DefaultChatTransport({
                api: getVoltAgentChatEndpoint(activeAgentId),
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
                                agentId: activeAgentId,
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
                    api: getVoltAgentChatResumeEndpoint(
                        activeAgentId,
                        id,
                        userId
                    ),
                }),
            }),
            onError: (err: Error) => {
                console.error('Chat error:', err)
            },
        })

    useEffect(() => {
        setMessages(allMessages)
    }, [allMessages, setMessages])

    useEffect(() => {
        const validateLoadedMessages = async () => {
            const result = await safeValidateUIMessages<UIMessage>({
                messages: allMessages,
            })

            if (result.success) {
                setMessages(result.data)
            }
        }

        void validateLoadedMessages()
    }, [allMessages, setMessages])

    const handlePromptClick = useCallback(
        (suggestion: string) => {
            void sendMessage({ text: suggestion })
        },
        [sendMessage]
    )

    const handleSubmit = useCallback(
        async (message: PromptInputMessage) => {
            const trimmedText = message.text.trim()

            if (trimmedText.length === 0 && message.files.length === 0) {
                return
            }

            if (trimmedText.length > 0 && message.files.length > 0) {
                await sendMessage({ text: trimmedText, files: message.files })
                return
            }

            if (trimmedText.length > 0) {
                await sendMessage({ text: trimmedText })
                return
            }

            await sendMessage({ files: message.files })
        },
        [sendMessage]
    )

    const handleRegenerate = useCallback(
        (messageId: string) => {
            void regenerate({ messageId })
        },
        [regenerate]
    )

    useEffect(() => {
        const modelsFromMessages = collectModelIdsFromMessages(messages)
        const agentModel = activeAgent?.model ?? ''
        setKnownModels(
            uniquePreserveOrder([
                selectedModel,
                agentModel,
                ...modelsFromMessages,
            ])
        )
    }, [activeAgent?.model, messages, selectedModel])

    useEffect(() => {
        if (selectedModel.trim().length > 0) {
            return
        }

        const latestAssistantModel =
            findLatestAssistantModelId(messages) ?? activeAgent?.model
        if (latestAssistantModel) {
            onSelectedModelChange(latestAssistantModel)
        }
    }, [activeAgent?.model, messages, selectedModel, onSelectedModelChange])

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {isMessagesLoading && (
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
                onRegenerate={handleRegenerate}
            />

            <ChatInput
                onSubmit={handleSubmit}
                selectedModel={selectedModel}
                defaultModelId={activeAgent?.model}
                onModelChange={onSelectedModelChange}
                modelOptions={knownModels}
                showWebPreview={showWebPreview}
                onWebPreviewToggle={setShowWebPreview}
            />
        </div>
    )
}

function uniquePreserveOrder(values: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const value of values) {
        const trimmed = value.trim()
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
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index]
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