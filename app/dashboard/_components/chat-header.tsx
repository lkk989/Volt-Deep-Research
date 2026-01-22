'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
    PencilIcon,
    TrashIcon,
    MoreHorizontalIcon,
    BotIcon,
} from 'lucide-react'

interface ChatHeaderProps {
    chatId: string
    userId: string
    onNewChat?: () => void
    onDelete?: () => void
}

export function ChatHeader({
    chatId,
    userId,
    onNewChat,
    onDelete,
}: ChatHeaderProps) {
    const [title, setTitle] = useState<string>('New Conversation')
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showMenu, setShowMenu] = useState(false)

    // Load conversation title from messages
    useEffect(() => {
        const loadTitle = async () => {
            try {
                const response = await fetch(
                    `/api/messages?conversationId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(userId)}`
                )

                if (!response.ok) {
                    throw new Error('Failed to load')
                }

                const data = await response.json()
                const messages = data.data || []

                if (messages.length > 0) {
                    const firstUserMessage = messages.find(
                        (m: { role: string }) => m.role === 'user'
                    )
                    if (firstUserMessage) {
                        const text = extractTextFromMessage(firstUserMessage)
                        if (text) {
                            setTitle(truncateText(text, 40))
                        }
                    }
                }
            } catch {
                // Use default title
            } finally {
                setIsLoading(false)
            }
        }

        void loadTitle()
    }, [chatId, userId])

    const handleTitleSubmit = useCallback((newTitle: string) => {
        const trimmed = newTitle.trim()
        if (trimmed) {
            setTitle(trimmed)
        }
        setIsEditing(false)
    }, [])

    const handleDelete = useCallback(() => {
        if (!confirm('Delete this conversation?')) return
        onDelete?.()
        onNewChat?.()
    }, [onDelete, onNewChat])

    if (isLoading) {
        return (
            <div className="flex h-14 items-center justify-between border-b bg-background px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BotIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-14 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BotIcon className="h-5 w-5 text-primary" />
                </div>
                {isEditing ? (
                    <input
                        type="text"
                        defaultValue={title}
                        aria-label="Conversation title"
                        className="w-64 rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onBlur={(e) => handleTitleSubmit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleTitleSubmit(e.currentTarget.value)
                            } else if (e.key === 'Escape') {
                                setIsEditing(false)
                            }
                        }}
                        autoFocus
                    />
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                    >
                        <span>{title}</span>
                        <PencilIcon className="h-3 w-3 opacity-50" />
                    </button>
                )}
            </div>

            <div className="relative">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setShowMenu(!showMenu)}
                            >
                                <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>More options</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md border bg-popover p-1 shadow-lg">
                            <button
                                onClick={() => {
                                    setIsEditing(true)
                                    setShowMenu(false)
                                }}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                            >
                                <PencilIcon className="h-4 w-4" />
                                Rename
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete()
                                    setShowMenu(false)
                                }}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function extractTextFromMessage(message: {
    parts?: Array<{ type: string; text?: string }>
}): string {
    if (!message.parts) return ''
    return message.parts
        .filter((part) => part.type === 'text' && part.text)
        .map((part) => part.text!)
        .join('')
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
}
