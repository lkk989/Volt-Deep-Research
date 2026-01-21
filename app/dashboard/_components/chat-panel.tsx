'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ChatInput } from './chat-input'
import { ChatMessages } from './chat-messages'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'

interface ChatPanelProps {
    chatId: string
    userId: string
    initialMessages?: UIMessage[]
    resume?: boolean
}

export function ChatPanel({
    chatId,
    userId,
    initialMessages = [],
    resume = true,
}: ChatPanelProps) {
    const [loadedMessages, setLoadedMessages] = useState<UIMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)

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

    return (
        <div className="flex h-screen flex-col">
            <ChatMessages
                messages={messages}
                status={status}
                error={error}
                onSuggestionClick={handlePromptClick}
            />
            <ChatInput
                onSubmit={handleSubmit}
                onModelChange={(model) => {
                    // Model change is handled internally in ChatInput
                    // This callback can be used for side effects if needed
                }}
            />
        </div>
    )
}
