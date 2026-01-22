'use client'

import { ChatPanel } from '../_components/chat-panel'
import { ChatHeader } from '../_components/chat-header'
import { nanoid } from 'nanoid'
import { useState, useCallback } from 'react'

export default function ChatPage() {
    const [chatId, setChatId] = useState(() => nanoid())
    const userId = 'user-1' // Replace with actual user ID from auth

    const handleNewChat = useCallback(() => {
        setChatId(nanoid())
    }, [])

    const handleDeleteChat = useCallback(() => {
        console.log('Delete conversation:', chatId)
    }, [chatId])

    return (
        <div className="flex flex-col h-full">
            <ChatHeader
                chatId={chatId}
                userId={userId}
                onNewChat={handleNewChat}
                onDelete={handleDeleteChat}
            />
            <ChatPanel chatId={chatId} userId={userId} />
        </div>
    )
}
