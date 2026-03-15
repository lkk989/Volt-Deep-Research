'use client'

import { messageHelpers } from '@voltagent/core'
import { useState, useMemo, useCallback } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    PencilIcon,
    TrashIcon,
    MoreHorizontalIcon,
    BotIcon,
} from 'lucide-react'
import {
    useVoltAgent,
    useVoltAgentList,
    useVoltConversationMessages,
} from '@/hooks/use-voltagent'

interface ChatHeaderProps {
    activeAgentId: string
    chatId: string
    userId: string
    selectedModel?: string
    onAgentChange?: (agentId: string) => void
    onNewChat?: () => void
    onDelete?: () => void
}

export function ChatHeader({
    activeAgentId,
    chatId,
    userId,
    selectedModel,
    onAgentChange,
    onNewChat,
    onDelete,
}: ChatHeaderProps) {
    const [customTitle, setCustomTitle] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const { data: agents = [], isLoading: isAgentsLoading } = useVoltAgentList()
    const { data: activeAgent, isLoading: isAgentLoading } =
        useVoltAgent(activeAgentId)
    const { data: messages = [], isLoading: isMessagesLoading } =
        useVoltConversationMessages(chatId, userId, activeAgentId)

    const derivedTitle = useMemo(() => {
        const firstUserMessage = messages.find((message) => message.role === 'user')
        if (!firstUserMessage) {
            return 'New Conversation'
        }

        const text = messageHelpers.extractText(firstUserMessage)
        return text.length > 0 ? truncateText(text, 40) : 'New Conversation'
    }, [messages])

    const effectiveTitle =
        customTitle.trim().length > 0 ? customTitle : derivedTitle
    const displayedTitle = isEditing ? effectiveTitle : effectiveTitle
    const isLoading = isAgentsLoading || isAgentLoading || isMessagesLoading
    const threadCount = messages.length

    const handleTitleSubmit = useCallback((newTitle: string) => {
        const trimmed = newTitle.trim()
        if (trimmed) {
            setCustomTitle(trimmed)
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
                    <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-40 animate-pulse rounded bg-muted/70" />
                    </div>
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
                        defaultValue={displayedTitle}
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
                        <span>{displayedTitle}</span>
                        <PencilIcon className="h-3 w-3 opacity-50" />
                    </button>
                )}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="secondary">{activeAgent?.name ?? activeAgentId}</Badge>
                    <span>{threadCount} messages</span>
                    {activeAgent?.isTelemetryEnabled ? (
                        <Badge variant="outline">Telemetry on</Badge>
                    ) : null}
                </div>
            </div>

            <div className="relative flex items-center gap-2">
                <Select value={activeAgentId} onValueChange={onAgentChange}>
                    <SelectTrigger className="min-w-52" size="sm">
                        <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                        {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedModel && selectedModel.trim().length > 0 && (
                    <span className="rounded-md border bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">
                        {selectedModel}
                    </span>
                )}
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

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '…'
}
