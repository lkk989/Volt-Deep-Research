# Dashboard Chat

## Chat Page Structure

```typescript
// app/dashboard/chat/page.tsx
'use client'

import { ChatPanel } from '../_components/chat-panel'
import { ChatHeader } from '../_components/chat-header'
import { nanoid } from 'nanoid'
import { useState, useCallback } from 'react'

export default function ChatPage() {
    const [chatId, setChatId] = useState(() => nanoid())
    const userId = 'user-1' // Replace with auth

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
```

## Layout

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen">
            <Sidebar />  {/* Sidebar is here for ALL pages */}
            <main className="flex-1">{children}</main>
        </div>
    )
}
```

## Components

`app/dashboard/_components/`:

- `chat-panel.tsx` - Main container (ChatMessages + ChatInput)
- `chat-messages.tsx` - Message rendering with ai-elements
- `chat-input.tsx` - User input
- `chat-header.tsx` - Title, delete conversation
- `sidebar.tsx` - Navigation (in layout)

## API Routes

`app/api/`:

- `chat/route.ts` - POST (send message)
- `chat/[id]/stream/route.ts` - GET (resume stream)
- `messages/route.ts` - GET (get messages)
- `health/route.ts` - GET (health check)

## Flow

```
dashboard/layout.tsx
└── Sidebar
└── chat/page.tsx
    ├── ChatHeader
    └── ChatPanel
        ├── ChatMessages
        └── ChatInput
```

## Pre-existing Issues

- `LibSQLMemoryAdapter` missing `deleteMessages`, `countConversations`
- `ai-elements/agent.tsx` duplicate `type` prop
- `ai-elements/code-block.tsx` string | undefined
