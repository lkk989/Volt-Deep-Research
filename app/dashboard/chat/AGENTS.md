# AGENTS.md

AI agents working on the chat module should reference the parent dashboard AGENTS.md for full context.

## Chat Module Overview

**Chat Page** - Entry point for the AI research assistant using VoltAgent orchestration.

## File Structure

```
app/dashboard/chat/
└── page.tsx    # Chat page entry point (creates chatId, userId, renders ChatPanel)
```

## Quick Reference

### Chat Page

```typescript
import { ChatPanel } from '../_components/chat-panel'
import { nanoid } from 'nanoid'

export default function ChatPage() {
    const chatId = nanoid()
    const userId = 'user-1' // Replace with actual user ID from auth

    return <ChatPanel chatId={chatId} userId={userId} initialMessages={[]} />
}
```

### Props

| Prop              | Type          | Description                            |
| ----------------- | ------------- | -------------------------------------- |
| `chatId`          | string        | Unique conversation ID (nanoid)        |
| `userId`          | string        | User identifier for memory             |
| `initialMessages` | `UIMessage[]` | Starting messages (empty for new chat) |

### Related Components

- **ChatPanel**: `../_components/chat-panel.tsx` - Main chat container
- **ChatMessages**: `../_components/chat-messages.tsx` - Message rendering
- **ChatInput**: `../_components/chat-input.tsx` - Input with model selector

### API Routes Used

- `POST /api/chat` - Send message, create stream
- `GET /api/chat/[id]/stream` - Resume stream
- `GET /api/messages` - Retrieve messages via sharedMemory

## Dependencies

- `@/components/ai-elements/*` - UI components for message rendering
- `@/voltagent/config/libsql.js` - sharedMemory for persistence
- `nanoid` - Unique ID generation

---

**Related**: [Parent AGENTS.md](../AGENTS.md)
**Last Updated**: January 2026
