# AGENTS.md - Dashboard Components

This folder contains React components for the Mastervolt Deep Research dashboard interface.

## Component Architecture

### Chat Components

- **chat-panel.tsx** - Main chat container using `@ai-sdk/react` `useChat` hook
- **chat-messages.tsx** - Message rendering with ai-elements components (Message, Tool, Reasoning, etc.)
- **chat-input.tsx** - Input area with PromptInput, ModelSelector, SpeechInput from ai-elements
- **chat-header.tsx** - Header with chat controls

### Workflow Components

- **workflow-list.tsx** - List/grid of available workflows from VoltAgent server
- **workflow-execution.tsx** - Execution panel for running workflows with real-time updates
- **workflow-canvas.tsx** - Visual canvas for workflow steps using ai-elements Canvas/Node/Edge
- **workflow-card.tsx** - Individual workflow card display
- **workflow-step-card.tsx** - Workflow step/checkpoint display
- **use-workflow.tsx** - React hook for workflow execution (if needed)

### Layout Components

- **sidebar.tsx** - Main navigation sidebar
- **artifact-panel.tsx** - Side panel for displaying artifacts/results
- **stats-cards.tsx** - Dashboard statistics cards
- **system-overview.tsx** - System status overview
- **quick-actions.tsx** - Quick action buttons
- **recent-activity.tsx** - Recent activity feed
- **icons.tsx** - Custom icon components
- **nav-icons.tsx** - Navigation icon components

## Key Patterns

### Using ai-elements Components
```tsx
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Canvas, Node, Edge } from '@/components/ai-elements/canvas'
import { Task, TaskTitle, TaskDescription } from '@/components/ai-elements/task'
import { Plan } from '@/components/ai-elements/plan'
import { Agent, AgentHeader, AgentContent } from '@/components/ai-elements/agent'
import { Checkpoint, CheckpointIcon, CheckpointTrigger } from '@/components/ai-elements/checkpoint'
```

### Using @ai-sdk/react Hooks
```tsx
import { useChat } from '@ai-sdk/react'

// Chat component pattern
const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
  api: '/api/chat',
  body: {
    options: {
      conversationId: chatId,
      userId: userId
    }
  }
})
```

### Calling VoltAgent API Directly
```tsx
// VoltAgent server runs on http://localhost:3141
// All workflows and agents available via built-in endpoints

// List workflows
const response = await fetch('http://localhost:3141/workflows')
const workflows = await response.json()

// Execute workflow with streaming
const response = await fetch(`http://localhost:3141/workflows/${workflowId}/stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: { topic: 'research topic' },
    userId: 'user-1',
    conversationId: nanoid()
  })
})

// Stream workflow events
const reader = response.body.getReader()
const decoder = new TextDecoder()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value)
  // Process SSE events
}
```

### Message Helpers from VoltAgent
```tsx
import { messageHelpers } from '@voltagent/core'

// Extract text from messages
const text = messageHelpers.extractText(message)

// Check if message has content
const hasContent = messageHelpers.hasContent(message)
```

## Code Style

- **TypeScript Strict Mode**: All types required, no implicit any
- **Client Components**: Use `'use client'` for interactive components
- **Named Exports**: Use named exports, not default exports
- **Server Components**: Server components by default (no 'use client')
- **Error Handling**: Use try-catch for async operations
- **Loading States**: Show loading indicators during async operations

## API Integration

### Next.js API Routes (app/api/)
- **POST /api/chat** - Proxies to VoltAgent agent.streamText(), returns streaming response
- **GET /api/messages** - Gets conversation messages from shared memory
- **GET /api/health** - Health check endpoint

### VoltAgent Server (localhost:3141)
All VoltAgent functionality available via built-in server:
- **GET /workflows** - List all workflows
- **POST /workflows/:id/stream** - Execute workflow with streaming
- **GET /agents** - List all agents
- **POST /agents/:id/chat** - Chat with specific agent
- **Swagger UI** - Available at http://localhost:3141/docs

## Component Dependencies

### Required UI Components (from @/components/ui)
- Button, Input, Dialog, Select, ScrollArea, Badge, Tooltip
- All from Radix UI primitives

### Required ai-elements (from @/components/ai-elements)
- Message, Tool, Reasoning, Sources, Persona, Artifact, CodeBlock
- Terminal, StackTrace, Sandbox, FileTree, TestResults
- Agent, Checkpoint, Confirmation, SchemaDisplay, Snippet, PackageInfo
- Canvas, Node, Edge, Connection
- Task, Plan, Queue
- PromptInput, ModelSelector, SpeechInput, VoiceSelector

### External Dependencies
- @ai-sdk/react (useChat hook)
- @voltagent/core (messageHelpers, Agent, Memory, etc.)
- lucide-react (icons)
- nanoid (ID generation)

## Development Guidelines

1. **Check existing components first** - Don't recreate what exists
2. **Use ai-elements** - Leverage provided UI components for AI features
3. **Follow chat-panel pattern** - Use useChat hook for agent interactions
4. **Call VoltAgent API directly** - Use localhost:3141, not custom Next.js routes
5. **Handle streaming properly** - Use SSE for real-time updates
6. **Type everything** - Full TypeScript coverage required
7. **Memoize expensive components** - Use React.memo for performance

## Testing

- Test components with actual VoltAgent server running
- Ensure VoltAgent server is started: `npm run dev` (runs voltagent/index.ts)
- Next.js dev server separate: `npm run dev:next`
- Both servers can run simultaneously: `npm run dev:test`

## Important Notes

- **NO custom API routes for workflows** - VoltAgent provides all endpoints
- **Use @ai-sdk/react hooks** - Not custom fetch wrappers
- **Import from @/components/ai-elements** - Not from @ai-sdk/elements
- **Follow existing patterns** - Especially chat-panel.tsx and chat-messages.tsx
- **Server runs on 3141** - VoltAgent server, not Next.js server (3000)
